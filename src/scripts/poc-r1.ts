// r1: score a timing log from the phone, print pass/fail
// usage: npm run poc:r1 -- <timing-log.json>
import { validateSongMap } from '@lingolyrics/song-map';
import { analyzeTimingLog, type TimingLog } from '@lingolyrics/sync';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const PASS_RATE = 0.95;
const TOLERANCE_MS = 500;

// results to stdout, failures to stderr
function bail(message: string, code: number): never {
  if (code === 0) console.log(message);
  else console.error(message);
  process.exit(code);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return bail(`cannot read ${path}: ${(e as Error).message}`, 1);
  }
}

const logArg = process.argv[2];
if (!logArg) bail('usage: npm run poc:r1 -- <timing-log.json>', 1);
const logPath = resolve(logArg);

const log = readJson(logPath) as Partial<TimingLog>;
if (log.version !== 1 || !Array.isArray(log.changes) || typeof log.songId !== 'string') {
  bail('not a timing log: needs version 1, songId and changes[]', 1);
}

// find the song map the log was recorded against
const songsDir = join(__dirname, '..', 'fixtures', 'songs');
const mapFile = readdirSync(songsDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.songmap.json'))
  .map((f) => join(songsDir, f))
  .find((f) => (readJson(f) as { id?: string }).id === log.songId);
if (!mapFile) bail(`no song map with id "${log.songId}" in fixtures/songs`, 1);
const map = validateSongMap(readJson(mapFile));
if (!map.ok) bail(`song map ${relative(process.cwd(), mapFile)} is invalid`, 1);

const r = analyzeTimingLog(log as TimingLog, map.map.lines, TOLERANCE_MS);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const ms = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(0)} ms`;

console.log(`R1 lyric sync: ${relative(process.cwd(), logPath)}`);
console.log(
  `song ${log.songId} on ${log.device}, updates every ${log.updateIntervalMs} ms, ${log.startedAt}`,
);
console.log('');
r.errorsMs.forEach((e, i) => {
  const c = log.changes![i]!;
  const flag = Math.abs(e) <= TOLERANCE_MS ? 'ok  ' : 'LATE';
  console.log(`  ${e < -TOLERANCE_MS ? 'EARLY' : flag} ${c.lineId}  ${ms(e)}`);
});
console.log('');
console.log(
  `within ${TOLERANCE_MS} ms : ${r.withinTolerance}/${r.changes} = ${pct(r.rate)}  (pass needs >= ${pct(PASS_RATE)})`,
);
console.log(
  `error         : median ${ms(r.medianErrorMs)}, p95 |${r.p95AbsErrorMs.toFixed(0)}| ms, max |${r.maxAbsErrorMs.toFixed(0)}| ms`,
);
console.log(`clock drift   : ${ms(r.clockDriftMs)} over the run (player position vs wall clock)`);
console.log('  note: this measures the position the player reports, not sound leaving the speaker');

const problems: string[] = [];
if (r.missedLineIds.length > 0) problems.push(`lines never logged: ${r.missedLineIds.join(', ')}`);
if (r.repeatedLineIds.length > 0) {
  problems.push(`lines logged twice (seek or restart?): ${r.repeatedLineIds.join(', ')}`);
}
if (problems.length > 0) {
  bail(
    `RESULT: NOT FINAL (${r.rate >= PASS_RATE ? 'would pass' : 'would fail'}). record one full uninterrupted play:\n  ${problems.join('\n  ')}`,
    2,
  );
}
const passed = r.rate >= PASS_RATE;
bail(`RESULT: ${passed ? 'PASS' : 'FAIL'}`, passed ? 0 : 1);

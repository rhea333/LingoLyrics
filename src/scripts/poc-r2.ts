// r2: score the segmenter against the gold set, print pass/fail
// usage: npm run poc:r2 [-- path/to/gold.json]
import { goldSpans, loadSegmenter, scoreLine, summarize, type LineScore } from '@lingolyrics/lang';
import { validateSongMap } from '@lingolyrics/song-map';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const PASS_ACCURACY = 0.9;
const EXPECTED_LINES = 20;

interface GoldLine {
  lineId: string;
  text: string;
  words: string[];
}
interface GoldFile {
  status: 'placeholder' | 'draft' | 'checked' | 'verified' | 'sample';
  checkedBy: string | null;
  checkedOn: string | null;
  reviewedBy: string | null;
  reviewedOn: string | null;
  songMap?: string;
  lines: GoldLine[];
}

const root = join(__dirname, '..');
const goldPath = resolve(process.argv[2] ?? join(root, 'fixtures', 'gold', 'ja-20-lines.json'));

function bail(message: string, code: number): never {
  console.log(message);
  process.exit(code);
}

// gold text must match the song map, else we score the wrong lines
function checkAgainstSongMap(gold: GoldFile): string[] {
  if (!gold.songMap) return [];
  const mapPath = join(dirname(goldPath), gold.songMap);
  if (!existsSync(mapPath)) return [`song map ${gold.songMap} not found`];
  const result = validateSongMap(JSON.parse(readFileSync(mapPath, 'utf8')));
  if (!result.ok) return [`song map ${gold.songMap} is invalid, run npm run validate:maps`];
  const byId = new Map(result.map.lines.map((l) => [l.id, l.text]));
  return gold.lines
    .filter((g) => byId.get(g.lineId) !== g.text)
    .map((g) => `line ${g.lineId} text differs from the song map`);
}

async function main(): Promise<void> {
  const gold = JSON.parse(readFileSync(goldPath, 'utf8')) as GoldFile;
  console.log(`R2 segmentation: ${relative(process.cwd(), goldPath)}`);

  if (gold.status === 'placeholder') {
    bail(
      'gold set is still a placeholder, add the lyrics and gold words first (see GUIDELINE.md)',
      2,
    );
  }

  const problems = checkAgainstSongMap(gold);
  // turn gold words into spans now so typos fail before any scoring
  const spans = gold.lines.map((g) => {
    try {
      return goldSpans(g.text, g.words);
    } catch (e) {
      problems.push(`line ${g.lineId}: ${(e as Error).message}`);
      return [];
    }
  });
  if (problems.length > 0) bail(`gold file problems:\n  ${problems.join('\n  ')}`, 1);

  const t0 = performance.now();
  const segmenter = await loadSegmenter(join(dirname(require.resolve('kuromoji')), '..', 'dict'));
  const loadMs = performance.now() - t0;

  const t1 = performance.now();
  const outputs = gold.lines.map((g) => segmenter.segment(g.text));
  const segmentMs = performance.now() - t1;

  const scores: LineScore[] = gold.lines.map((g, i) => {
    const score = scoreLine(g.text, spans[i]!, outputs[i]!);
    const ok = score.missed.length === 0;
    console.log(`  ${ok ? 'ok  ' : 'MISS'} ${g.lineId}  ${g.words.join(' | ')}`);
    if (!ok) {
      console.log(`             got  ${outputs[i]!.map((t) => t.surface).join(' | ')}`);
      console.log(`             missed: ${score.missed.join(', ')}`);
    }
    return score;
  });

  const s = summarize(scores);
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log('');
  console.log(
    `words matched : ${s.matched}/${s.goldWords} = ${pct(s.accuracy)}  (pass needs >= ${pct(PASS_ACCURACY)})`,
  );
  console.log(`precision     : ${s.matched}/${s.predictedWords} = ${pct(s.precision)}`);
  console.log(
    `timing (this computer, not the phone): dictionary ${(loadMs / 1000).toFixed(2)} s, ${s.lines} lines ${segmentMs.toFixed(0)} ms`,
  );
  console.log('  the 3 s lesson-ready check is measured on the phone in the learner app');
  if (s.lines !== EXPECTED_LINES)
    console.log(`  note: ${s.lines} lines, plan says ${EXPECTED_LINES}`);

  const passed = s.accuracy >= PASS_ACCURACY;
  if (gold.status !== 'verified') {
    bail(
      `RESULT: NOT FINAL (${passed ? 'would pass' : 'would fail'}). gold status is "${gold.status}", needs Rhea's check and Raymond's review`,
      2,
    );
  }
  console.log(
    `checked by ${gold.checkedBy} on ${gold.checkedOn}, reviewed by ${gold.reviewedBy} on ${gold.reviewedOn}`,
  );
  bail(`RESULT: ${passed ? 'PASS' : 'FAIL'}`, passed ? 0 : 1);
}

main().catch((e: unknown) => bail(`poc-r2 crashed: ${(e as Error).stack ?? String(e)}`, 1));

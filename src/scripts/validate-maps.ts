// checks every song map in fixtures/ against the schema + timing rules
import { validateSongMap } from '@lingolyrics/song-map';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '..');
const songsDir = join(root, 'fixtures', 'songs');

// find *.songmap.json under fixtures/songs, missing dir counts as none
const maps = existsSync(songsDir)
  ? readdirSync(songsDir, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.songmap.json'))
      .map((f) => join(songsDir, f))
  : [];

// zero maps means something moved, dont pass silently
if (maps.length === 0) {
  console.error(`validate-maps: no *.songmap.json found in ${relative(root, songsDir)}`);
  process.exit(1);
}

let failed = 0;
maps.forEach((file) => {
  const name = relative(root, file);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    // bad json, report it and keep going
    failed += 1;
    console.log(`FAIL  ${name}\n      not valid JSON: ${(e as Error).message}`);
    return;
  }

  const result = validateSongMap(data);
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!result.ok) {
    failed += 1;
    result.errors.forEach((e) => console.log(`      ${e.path} ${e.message}`));
  }
});

console.log(`validate-maps: ${maps.length - failed}/${maps.length} valid`);
process.exit(failed === 0 ? 0 : 1);

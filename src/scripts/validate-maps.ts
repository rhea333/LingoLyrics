// checks every song map in fixtures/ against the shared schema
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '..');
const schemaPath = join(root, 'packages', 'song-map', 'schema', 'song-map.schema.json');
const songsDir = join(root, 'fixtures', 'songs');

// find *.songmap.json under fixtures/songs
function findMaps(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.songmap.json'))
    .map((f) => join(dir, f));
}

const maps = findMaps(songsDir);
if (maps.length === 0) {
  // nothing to check yet, not a failure
  console.log('validate-maps: no song maps found, skipping');
  process.exit(0);
}
if (!existsSync(schemaPath)) {
  console.error(`validate-maps: schema missing at ${relative(root, schemaPath)}`);
  process.exit(1);
}

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));

let failed = 0;
maps.forEach((file) => {
  const ok = validate(JSON.parse(readFileSync(file, 'utf8')));
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${relative(root, file)}`);
  if (!ok) {
    failed += 1;
    validate.errors?.forEach((e) => console.log(`      ${e.instancePath || '/'} ${e.message}`));
  }
});

console.log(`validate-maps: ${maps.length - failed}/${maps.length} valid`);
process.exit(failed === 0 ? 0 : 1);

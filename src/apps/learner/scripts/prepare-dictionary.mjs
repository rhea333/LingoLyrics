// Decompress kuromoji once on the build machine rather than on the phone.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve('kuromoji/package.json')), 'dict');
const output = fileURLToPath(new URL('../assets/dict/', import.meta.url));
mkdirSync(output, { recursive: true });
let count = 0;
for (const name of readdirSync(source).filter((file) => file.endsWith('.dat.gz'))) {
  writeFileSync(join(output, name.slice(0, -3)), gunzipSync(readFileSync(join(source, name))));
  count += 1;
}
if (count !== 12) throw new Error(`Expected 12 dictionary files, got ${count}`);
console.log(`Prepared ${count} uncompressed dictionary assets`);

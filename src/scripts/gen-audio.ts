// makes the test song audio from its song map: a soft tone per line plus a
// click at each line start, so highlight vs sound can be checked by ear or video
// usage: npm run gen:audio
import { validateSongMap } from '@lingolyrics/song-map';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SAMPLE_RATE = 22050;
const mapPath = join(__dirname, '..', 'fixtures', 'songs', 'ja', 'poc-test-song.songmap.json');

const result = validateSongMap(JSON.parse(readFileSync(mapPath, 'utf8')));
if (!result.ok) {
  console.error('song map is invalid, run npm run validate:maps');
  process.exit(1);
}
const { map } = result;

// pentatonic steps so it sounds less like a test tone
const NOTES_HZ = [262, 294, 330, 392, 440, 523];
const samples = new Float32Array(Math.ceil((map.audio.durationMs / 1000) * SAMPLE_RATE));
const at = (ms: number) => Math.round((ms / 1000) * SAMPLE_RATE);

map.lines.forEach((line, i) => {
  const hz = NOTES_HZ[i % NOTES_HZ.length]!;
  const start = at(line.startMs);
  const end = Math.min(at(line.endMs), samples.length);
  for (let n = start; n < end; n += 1) {
    const t = (n - start) / SAMPLE_RATE;
    // short fade in and out, no pops
    const fade = Math.min(1, t / 0.05, (end - n) / SAMPLE_RATE / 0.05);
    samples[n] = 0.15 * fade * Math.sin(2 * Math.PI * hz * t);
  }
  // 20 ms 2 kHz click right on startMs
  const clickEnd = Math.min(start + at(20), samples.length);
  for (let n = start; n < clickEnd; n += 1) {
    const t = (n - start) / SAMPLE_RATE;
    samples[n] = (samples[n] ?? 0) + 0.6 * Math.sin(2 * Math.PI * 2000 * t);
  }
});

// 16-bit pcm wav
const data = Buffer.alloc(samples.length * 2);
samples.forEach((s, n) =>
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), n * 2),
);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // pcm
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const out = join(dirname(mapPath), map.audio.file);
writeFileSync(out, Buffer.concat([header, data]));
console.log(
  `wrote ${relative(process.cwd(), out)}: ${map.lines.length} lines, ${(map.audio.durationMs / 1000).toFixed(1)} s`,
);

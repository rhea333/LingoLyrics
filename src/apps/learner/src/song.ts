import { validateSongMap, type SongMap, type SongMapError } from '@lingolyrics/song-map';
import songJson from '../../../fixtures/songs/ja/poc-test-song.songmap.json';

// metro bundles the wav, run npm run gen:audio first
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
export const songAudio: number = require('../../../fixtures/songs/ja/poc-test-song.wav');

export type SongLoad =
  { ok: true; map: SongMap; validateMs: number } | { ok: false; errors: SongMapError[] | string };

/** validates the bundled song map. also checks ajv runs under hermes */
export function loadSong(): SongLoad {
  const t0 = performance.now();
  try {
    const result = validateSongMap(songJson);
    if (!result.ok) return { ok: false, errors: result.errors };
    return { ok: true, map: result.map, validateMs: performance.now() - t0 };
  } catch (e) {
    // ajv builds code with new Function, this is where hermes would fail
    return { ok: false, errors: `validator crashed: ${(e as Error).message}` };
  }
}

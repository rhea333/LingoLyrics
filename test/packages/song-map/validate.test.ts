import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateSongMap, type SongMap } from '@lingolyrics/song-map';

const fixture = join(__dirname, '../../../src/fixtures/songs/ja/poc-test-song.songmap.json');

// small valid map, each test breaks one thing
function validMap(): SongMap {
  return {
    schemaVersion: '1.0.0',
    id: 'test-song',
    title: 'Test',
    artist: 'Team',
    language: 'ja',
    audio: { file: 'test.wav', durationMs: 10000 },
    rights: {
      lyrics: { license: 'MIT', source: 'team' },
      audio: { license: 'CC0-1.0', source: 'generated' },
    },
    lines: [
      {
        id: 'l1',
        startMs: 0,
        endMs: 4000,
        text: '猫が好き',
        words: [
          { start: 0, end: 1, surface: '猫' },
          { start: 1, end: 2, surface: 'が' },
          { start: 2, end: 4, surface: '好き' },
        ],
      },
      { id: 'l2', startMs: 4000, endMs: 8000, text: '犬も好き' },
    ],
  };
}

function errorPaths(data: unknown): string[] {
  const result = validateSongMap(data);
  return result.ok ? [] : result.errors.map((e) => e.path);
}

describe('validateSongMap', () => {
  it('accepts a valid map and returns it typed', () => {
    const result = validateSongMap(validMap());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.map.lines).toHaveLength(2);
  });

  it('accepts the poc fixture', () => {
    const data: unknown = JSON.parse(readFileSync(fixture, 'utf8'));
    expect(validateSongMap(data)).toMatchObject({ ok: true });
  });

  describe('schema rules', () => {
    it('rejects non-objects', () => {
      expect(validateSongMap(null).ok).toBe(false);
      expect(validateSongMap('song').ok).toBe(false);
    });

    it('requires rights so unlicensed content is caught', () => {
      const { rights, ...noRights } = validMap();
      expect(rights).toBeDefined();
      expect(validateSongMap(noRights).ok).toBe(false);
    });

    it('rejects a schema version from another major', () => {
      expect(errorPaths({ ...validMap(), schemaVersion: '2.0.0' })).toContain('/schemaVersion');
    });

    it('rejects unknown fields', () => {
      expect(validateSongMap({ ...validMap(), tempo: 120 }).ok).toBe(false);
    });

    it('rejects fractional timestamps', () => {
      const map = validMap();
      map.lines[0]!.startMs = 0.5;
      expect(errorPaths(map)).toContain('/lines/0/startMs');
    });

    it('rejects an empty line list', () => {
      expect(validateSongMap({ ...validMap(), lines: [] }).ok).toBe(false);
    });
  });

  describe('timing rules', () => {
    it('rejects a line that ends before it starts', () => {
      const map = validMap();
      map.lines[1]!.endMs = 3000;
      expect(errorPaths(map)).toContain('/lines/1/endMs');
    });

    it('rejects overlapping lines', () => {
      const map = validMap();
      map.lines[1]!.startMs = 3500;
      expect(errorPaths(map)).toContain('/lines/1/startMs');
    });

    it('rejects lines out of order', () => {
      const map = validMap();
      map.lines.reverse();
      expect(validateSongMap(map).ok).toBe(false);
    });

    it('rejects a line past the end of the audio', () => {
      const map = validMap();
      map.lines[1]!.endMs = 12000;
      expect(errorPaths(map)).toContain('/lines/1/endMs');
    });

    it('rejects duplicate line ids', () => {
      const map = validMap();
      map.lines[1]!.id = 'l1';
      expect(errorPaths(map)).toContain('/lines/1/id');
    });
  });

  describe('word rules', () => {
    it('rejects a surface that does not match the text', () => {
      const map = validMap();
      map.lines[0]!.words![2]!.surface = '嫌い';
      expect(errorPaths(map)).toContain('/lines/0/words/2/surface');
    });

    it('rejects offsets past the end of the line', () => {
      const map = validMap();
      map.lines[0]!.words![2]!.end = 9;
      expect(errorPaths(map)).toContain('/lines/0/words/2');
    });

    it('rejects overlapping words', () => {
      const map = validMap();
      map.lines[0]!.words![1] = { start: 0, end: 2, surface: '猫が' };
      expect(errorPaths(map)).toContain('/lines/0/words/1');
    });
  });

  it('reports every problem, not just the first', () => {
    const map = validMap();
    map.lines[1]!.id = 'l1';
    map.lines[1]!.endMs = 12000;
    expect(errorPaths(map).length).toBeGreaterThanOrEqual(2);
  });
});

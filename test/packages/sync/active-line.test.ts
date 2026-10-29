import { activeLineAt, type TimedLine } from '@lingolyrics/sync';

// 1 s gap between line b and c
const lines: TimedLine[] = [
  { id: 'a', startMs: 1000, endMs: 2000 },
  { id: 'b', startMs: 2000, endMs: 3000 },
  { id: 'c', startMs: 4000, endMs: 5000 },
];

describe('activeLineAt', () => {
  it.each([
    [0, -1], // before first line
    [999, -1],
    [1000, 0], // start is inclusive
    [1999, 0],
    [2000, 1], // end is exclusive, next line takes over
    [3500, -1], // gap
    [4000, 2],
    [4999, 2],
    [5000, -1], // after last line
    [99999, -1],
  ])('at %i ms -> %i', (pos, expected) => {
    expect(activeLineAt(lines, pos)).toBe(expected);
  });

  it('returns -1 for no lines', () => {
    expect(activeLineAt([], 1000)).toBe(-1);
  });

  it('agrees with a linear scan on a long map', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: `l${i}`,
      startMs: i * 1000,
      endMs: i * 1000 + 900,
    }));
    const linear = (pos: number) => many.findIndex((l) => l.startMs <= pos && pos < l.endMs);
    for (let pos = -500; pos < 201000; pos += 137) {
      expect(activeLineAt(many, pos)).toBe(linear(pos));
    }
  });
});

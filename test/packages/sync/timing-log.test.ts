import { analyzeTimingLog, LineTracker, type TimedLine, type TimingLog } from '@lingolyrics/sync';

const lines: TimedLine[] = [
  { id: 'a', startMs: 1000, endMs: 2000 },
  { id: 'b', startMs: 2000, endMs: 3000 },
  { id: 'c', startMs: 4000, endMs: 5000 },
];

function logOf(changes: TimingLog['changes']): TimingLog {
  return {
    version: 1,
    songId: 'test',
    device: 'jest',
    updateIntervalMs: 50,
    startedAt: '2026-10-28T00:00:00Z',
    changes,
  };
}

describe('LineTracker', () => {
  it('logs each new line once, not every update', () => {
    const t = new LineTracker(lines);
    // status updates every 300 ms, like a slow player
    for (let pos = 0; pos <= 5400; pos += 300) t.update(pos, pos + 10000);
    expect(t.changes.map((c) => [c.lineId, c.mappedMs, c.positionMs])).toEqual([
      ['a', 1000, 1200],
      ['b', 2000, 2100],
      ['c', 4000, 4200],
    ]);
  });

  it('returns the change only on the update that caused it', () => {
    const t = new LineTracker(lines);
    expect(t.update(500, 0)).toBeUndefined();
    expect(t.update(1050, 0)).toMatchObject({ lineId: 'a' });
    expect(t.update(1100, 0)).toBeUndefined();
    expect(t.activeIndex).toBe(0);
  });

  it('does not log moving into a gap', () => {
    const t = new LineTracker(lines);
    t.update(2500, 0);
    t.update(3500, 0);
    expect(t.activeIndex).toBe(-1);
    expect(t.changes).toHaveLength(1);
  });

  it('starts over after reset', () => {
    const t = new LineTracker(lines);
    t.update(1500, 0);
    t.reset();
    expect(t.changes).toHaveLength(0);
    expect(t.update(1500, 0)).toMatchObject({ lineId: 'a' });
  });
});

describe('analyzeTimingLog', () => {
  it('counts changes within tolerance, inclusive', () => {
    const r = analyzeTimingLog(
      logOf([
        { lineId: 'a', mappedMs: 1000, positionMs: 1040, wallMs: 0 },
        { lineId: 'b', mappedMs: 2000, positionMs: 2500, wallMs: 1000 },
        { lineId: 'c', mappedMs: 4000, positionMs: 4600, wallMs: 3000 },
      ]),
      lines,
    );
    expect(r).toMatchObject({ changes: 3, withinTolerance: 2, errorsMs: [40, 500, 600] });
    expect(r.rate).toBeCloseTo(2 / 3);
    expect(r.maxAbsErrorMs).toBe(600);
  });

  it('counts early highlights by size too', () => {
    const r = analyzeTimingLog(
      logOf([{ lineId: 'a', mappedMs: 1000, positionMs: 400, wallMs: 0 }]),
      lines,
    );
    expect(r.withinTolerance).toBe(0);
    expect(r.errorsMs).toEqual([-600]);
  });

  it('lists missed and repeated lines', () => {
    const r = analyzeTimingLog(
      logOf([
        { lineId: 'a', mappedMs: 1000, positionMs: 1000, wallMs: 0 },
        { lineId: 'a', mappedMs: 1000, positionMs: 1010, wallMs: 5000 },
      ]),
      lines,
    );
    expect(r.missedLineIds).toEqual(['b', 'c']);
    expect(r.repeatedLineIds).toEqual(['a']);
  });

  it('measures player clock drift against the wall clock', () => {
    // position moves 3000 ms while 3100 ms of wall time pass
    const r = analyzeTimingLog(
      logOf([
        { lineId: 'a', mappedMs: 1000, positionMs: 1000, wallMs: 500 },
        { lineId: 'c', mappedMs: 4000, positionMs: 4000, wallMs: 3600 },
      ]),
      lines,
    );
    expect(r.clockDriftMs).toBe(-100);
  });

  it('gives zeros for an empty log instead of NaN', () => {
    expect(analyzeTimingLog(logOf([]), lines)).toMatchObject({
      rate: 0,
      medianErrorMs: 0,
      p95AbsErrorMs: 0,
      maxAbsErrorMs: 0,
      clockDriftMs: 0,
    });
  });
});

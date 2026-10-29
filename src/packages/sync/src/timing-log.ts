import { activeLineAt, type TimedLine } from './active-line';

/** one line change, written when the highlight moves to a new line */
export interface LineChange {
  lineId: string;
  /** line startMs from the song map */
  mappedMs: number;
  /** player position reported when we noticed the change */
  positionMs: number;
  /** performance.now() at that moment */
  wallMs: number;
}

/** what the app writes and poc:r1 reads */
export interface TimingLog {
  version: 1;
  songId: string;
  /** free text, e.g. "iPhone 13, iOS 19.1, wired headphones" */
  device: string;
  /** player status update interval the app asked for */
  updateIntervalMs: number;
  /** iso time the run started */
  startedAt: string;
  changes: LineChange[];
}

/**
 * watches player positions and reports each move to a new line.
 * feed it every status update, it returns the change or undefined
 */
export class LineTracker {
  private current = -1;

  readonly changes: LineChange[] = [];

  constructor(private readonly lines: readonly TimedLine[]) {}

  /** index of the highlighted line, -1 for none */
  get activeIndex(): number {
    return this.current;
  }

  update(positionMs: number, wallMs: number): LineChange | undefined {
    const next = activeLineAt(this.lines, positionMs);
    if (next === this.current) return undefined;
    this.current = next;
    // leaving a line into a gap is not a line change
    if (next === -1) return undefined;
    const line = this.lines[next]!;
    const change = { lineId: line.id, mappedMs: line.startMs, positionMs, wallMs };
    this.changes.push(change);
    return change;
  }

  /** forget everything, call on restart or seek */
  reset(): void {
    this.current = -1;
    this.changes.length = 0;
  }
}

/** r1 result */
export interface TimingReport {
  toleranceMs: number;
  changes: number;
  withinTolerance: number;
  /** withinTolerance / changes, the r1 pass number */
  rate: number;
  /** position - mapped, ms. positive means the highlight was late */
  errorsMs: number[];
  medianErrorMs: number;
  p95AbsErrorMs: number;
  maxAbsErrorMs: number;
  /** map lines with no logged change, e.g. playback stopped early */
  missedLineIds: string[];
  /** lines logged more than once, usually a seek or restart mid-run */
  repeatedLineIds: string[];
  /**
   * player clock vs wall clock over the run, ms. near 0 means the reported
   * position moves at real speed. it cant see fixed output latency
   */
  clockDriftMs: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, i)]!;
}

/** scores a timing log against the song map lines */
export function analyzeTimingLog(
  log: TimingLog,
  lines: readonly TimedLine[],
  toleranceMs = 500,
): TimingReport {
  const errorsMs = log.changes.map((c) => c.positionMs - c.mappedMs);
  const abs = errorsMs.map(Math.abs).sort((a, b) => a - b);
  const within = abs.filter((e) => e <= toleranceMs).length;

  const counts = new Map<string, number>();
  log.changes.forEach((c) => counts.set(c.lineId, (counts.get(c.lineId) ?? 0) + 1));

  // drift: did position advance as fast as the wall clock
  const first = log.changes[0];
  const last = log.changes[log.changes.length - 1];
  const clockDriftMs =
    first && last ? last.positionMs - first.positionMs - (last.wallMs - first.wallMs) : 0;

  return {
    toleranceMs,
    changes: log.changes.length,
    withinTolerance: within,
    rate: log.changes.length === 0 ? 0 : within / log.changes.length,
    errorsMs,
    medianErrorMs: percentile(
      [...errorsMs].sort((a, b) => a - b),
      0.5,
    ),
    p95AbsErrorMs: percentile(abs, 0.95),
    maxAbsErrorMs: abs[abs.length - 1] ?? 0,
    missedLineIds: lines.filter((l) => !counts.has(l.id)).map((l) => l.id),
    repeatedLineIds: [...counts].filter(([, n]) => n > 1).map(([id]) => id),
    clockDriftMs,
  };
}

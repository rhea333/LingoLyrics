export interface TimedLine {
  startMs: number;
}

export interface LineChange {
  lineIndex: number;
  mappedMs: number;
  observedMs: number;
}

export function activeLineAt(positionMs: number, lines: TimedLine[]): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (line && positionMs >= line.startMs) return index;
  }
  return -1;
}

export function scoreLineChanges(changes: LineChange[], toleranceMs = 500) {
  const errorsMs = changes.map((change) => Math.abs(change.observedMs - change.mappedMs));
  const withinTolerance = errorsMs.filter((error) => error <= toleranceMs).length;
  const rate = changes.length === 0 ? 0 : withinTolerance / changes.length;
  return { errorsMs, withinTolerance, rate, passed: changes.length > 0 && rate >= 0.95 };
}

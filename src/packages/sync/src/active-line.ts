/** the timing part of a song map line */
export interface TimedLine {
  id: string;
  startMs: number;
  endMs: number;
}

/**
 * index of the line playing at positionMs, -1 before the first line, after
 * the last, or in a gap between lines. lines must be sorted and not overlap,
 * which validateSongMap checks
 */
export function activeLineAt(lines: readonly TimedLine[], positionMs: number): number {
  // binary search for the last line starting at or before positionMs
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lines[mid]!.startMs <= positionMs) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (found === -1) return -1;
  // in a gap after this line ended
  return positionMs < lines[found]!.endMs ? found : -1;
}

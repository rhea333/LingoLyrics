# @lingolyrics/sync

Lyric timing for risk R1. It turns a playback position into the active lyric
line, logs each line change, and scores a timing log against the song map.
It's pure TypeScript with no audio code, so it runs under Jest without a phone,
and the editor can reuse it.

## Public API

```ts
import { activeLineAt, LineTracker, analyzeTimingLog } from '@lingolyrics/sync';

activeLineAt(map.lines, 2500); // index of the line playing at 2.5 s, or -1

const tracker = new LineTracker(map.lines);
player.addListener('playbackStatusUpdate', (s) => {
  const change = tracker.update(s.currentTime * 1000, performance.now());
  if (change) highlight(tracker.activeIndex);
});

const report = analyzeTimingLog(log, map.lines); // report.rate >= 0.95 passes R1
```

| Export                                            | Description                                                                                                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeLineAt(lines, positionMs)`                 | Binary search. `startMs` is inclusive, `endMs` exclusive. Returns -1 before the first line, after the last, or in a gap. Lines must be sorted and not overlap (`validateSongMap` checks this). |
| `LineTracker`                                     | Feed it every player status update. `update()` returns a `LineChange` only when the highlight moves to a new line. Moving into a gap is not logged. Call `reset()` on restart or seek.         |
| `TimingLog`                                       | What the app saves: `{ version: 1, songId, device, updateIntervalMs, startedAt, changes[] }`. Each change is `{ lineId, mappedMs, positionMs, wallMs }`.                                       |
| `analyzeTimingLog(log, lines, toleranceMs = 500)` | Returns a `TimingReport`: `rate`, `withinTolerance`, per-change `errorsMs` (positive means late), median, p95 and max error, `missedLineIds`, `repeatedLineIds`, and `clockDriftMs`.           |

## What R1 measures, and what it doesn't

The error is `positionMs - mappedMs`, measured at the moment the app notices a
line change. It shows how late the highlight moves relative to the position
the player reports, which is mostly the status update interval (the app asks
for 50 ms). It **cannot** see output latency between the reported position and
sound leaving the speaker, such as Bluetooth headphones adding 150–250 ms.

- `clockDriftMs` compares how far the reported position moved with how much
  wall-clock time passed. A large drift means the player's clock is off.
- To check real output latency, use the generated audio: it has a click at
  every line start (`npm run gen:audio`). Film the phone and compare the click
  with the highlight frame by frame.

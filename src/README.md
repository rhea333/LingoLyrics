# LingoLyrics Source Code

Proof of Concept (PoC) code for LingoLyrics. It exists to show that the three
PoC risks in the [Development Plan](../docs/DevelopmentPlan/DevelopmentPlan.tex)
can be overcome:

- **R1** lyric sync on a phone
- **R2** segmenting Japanese lyrics into words with romanization
- **R3** sending a vocabulary note to Anki from a phone

This is an npm workspace rooted in this folder. Logic lives in plain TypeScript
packages, so it can be tested with Jest without a phone and reused by the
future web editor. The Expo app only wires those packages to a screen.

## Layout

| Path                 | Purpose                                                                                     | Status              |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| `packages/song-map/` | JSON Schema, TS types and validator for song maps. Shared by the app and the future editor. | done                |
| `packages/lang/`     | `segment(line)` returns tokens with surface, reading and romaji (R2).                       | done                |
| `packages/sync/`     | Maps a playback position to the active line, and analyzes timing logs (R1).                 | done                |
| `packages/anki/`     | One interface with AnkiMobile URL scheme, AnkiConnect and export-file adapters (R3).        | phase 5             |
| `apps/learner/`      | Expo app with one demo screen per risk. PoC only, may be thrown out.                        | R1 done, R2 blocked |
| `fixtures/songs/`    | The Japanese test song and its song map (lyrics are placeholders).                          | done                |
| `fixtures/gold/`     | Gold segmentation for the 20 R2 test lines (placeholder).                                   | done                |
| `scripts/`           | Command-line tools: map validation and the PoC measurement scripts.                         |                     |

Tests live in [`../test`](../test/README.md), mirroring `packages/`.

## Setup

Requires Node 22 or newer (CI uses Node 24).

```sh
cd src
npm install
```

`npm install` also installs the Husky pre-commit hook, which runs ESLint and
Prettier on staged files under `src/`.

## Commands

Run from `src/`:

| Command                           | What it does                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `npm run lint`                    | ESLint (Airbnb TypeScript rules) on `src/` and `test/`                       |
| `npm run format` / `format:check` | Prettier write / check                                                       |
| `npm run typecheck`               | `tsc` in strict mode, no output                                              |
| `npm test` / `test:coverage`      | Jest, with coverage                                                          |
| `npm run validate:maps`           | Validates every `fixtures/songs/**/*.songmap.json` against the schema        |
| `npm run gen:audio`               | Generates the test song WAV (tones plus a click per line) from the song map  |
| `npm run poc:r1 -- <log.json>`    | R1: scores a timing log from the phone, prints PASS / FAIL / NOT FINAL       |
| `npm run poc:r2 [-- gold.json]`   | R2: scores segmentation against the gold set, prints PASS / FAIL / NOT FINAL |
| `npm run docs:api`                | TypeDoc API docs into `docs-api/`                                            |

CI (`.github/workflows/code-ci.yml`) runs lint, format check, type-check, Jest
and map validation on changes to `src/` or `test/`.

## Toolchain notes

- TypeScript is pinned to 5.5.x. It is the newest version that
  typescript-eslint 7 supports, and typescript-eslint 7 is the newest version
  that works with `eslint-config-airbnb-typescript` and ESLint 8.
- ESLint 8 no longer receives updates. Moving to ESLint 9 would mean replacing
  `eslint-config-airbnb-typescript`, for example with
  `eslint-config-airbnb-extended`.

## PoC measurements

Each script prints a short summary for the demo and exits `0` on PASS, `1` on
FAIL, or `2` when the result can't be final yet (placeholder or unverified data).

- `npm run poc:r1 -- <log.json>`: scores a timing log shared from the R1
  screen. Pass needs at least 95% of line changes within 0.5 s of their mapped
  timestamps. A log with missed or repeated lines (pause, seek) is NOT FINAL.
  See `apps/learner/README.md` for how to record one.
- `npm run poc:r2`: scores the segmenter against
  `fixtures/gold/ja-20-lines.json`. Pass needs at least 90% of gold words
  matched exactly, with the gold set `verified` (see
  `fixtures/gold/GUIDELINE.md`). It also prints dictionary load time on this
  computer; the 3 s phone check is in the learner app.

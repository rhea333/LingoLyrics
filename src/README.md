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

| Path                 | Purpose                                                                                     | Status  |
| -------------------- | ------------------------------------------------------------------------------------------- | ------- |
| `packages/song-map/` | JSON Schema, TS types and validator for song maps. Shared by the app and the future editor. | phase 2 |
| `packages/lang/`     | `segment(line)` returns tokens with surface, reading and romaji (R2).                       | phase 3 |
| `packages/sync/`     | Maps a playback position to the active line, and analyzes timing logs (R1).                 | phase 4 |
| `packages/anki/`     | One interface with AnkiMobile URL scheme, AnkiConnect and export-file adapters (R3).        | phase 5 |
| `apps/learner/`      | Expo app with one demo screen per risk. PoC only, may be thrown out.                        | phase 4 |
| `fixtures/songs/`    | The Japanese test song and its song map.                                                    | phase 2 |
| `fixtures/gold/`     | Gold segmentation for the 20 R2 test lines.                                                 | phase 3 |
| `scripts/`           | Command-line tools: map validation and the PoC measurement scripts.                         |         |

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

| Command                           | What it does                                                          |
| --------------------------------- | --------------------------------------------------------------------- |
| `npm run lint`                    | ESLint (Airbnb TypeScript rules) on `src/` and `test/`                |
| `npm run format` / `format:check` | Prettier write / check                                                |
| `npm run typecheck`               | `tsc` in strict mode, no output                                       |
| `npm test` / `test:coverage`      | Jest, with coverage                                                   |
| `npm run validate:maps`           | Validates every `fixtures/songs/**/*.songmap.json` against the schema |
| `npm run docs:api`                | TypeDoc API docs into `docs-api/`                                     |

CI (`.github/workflows/code-ci.yml`) runs lint, format check, type-check, Jest
and map validation on changes to `src/` or `test/`.

## Toolchain notes

- TypeScript is pinned to 5.5.x. It is the newest version that
  typescript-eslint 7 supports, and typescript-eslint 7 is the newest version
  that works with `eslint-config-airbnb-typescript` and ESLint 8.
- ESLint 8 no longer receives updates. Moving to ESLint 9 would mean replacing
  `eslint-config-airbnb-typescript`, for example with
  `eslint-config-airbnb-extended`.

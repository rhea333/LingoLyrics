# Automated tests

Jest tests for the packages in [`../src/packages`](../src/README.md). The
folders here mirror `src/packages/`:

| Folder               | Tests for                                            |
| -------------------- | ---------------------------------------------------- |
| `packages/song-map/` | schema and validator                                 |
| `packages/lang/`     | segmentation and romanization (phase 3)              |
| `packages/sync/`     | active-line lookup and timing-log analysis (phase 4) |
| `packages/anki/`     | note building and adapters (phase 5)                 |

Tests are written in TypeScript and named `*.test.ts`. Import package code by
its workspace name, for example `import { activeLineAt } from '@lingolyrics/sync'`.
The Jest and TypeScript configs in `src/` map those names to `src/packages/*/src`.

## Running

All tooling is installed in `src/`, so run commands from there:

```sh
cd src
npm test               # all tests
npm run test:coverage  # with coverage summary
npx jest lang          # only test files whose path matches "lang"
```

`npm run lint` and `npm run typecheck` in `src/` also cover this folder.
`.eslintrc.cjs` here extends `src/.eslintrc.cjs` and turns on Jest globals.

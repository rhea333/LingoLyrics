# @lingolyrics/song-map

The song-map format shared by the learner app and the future song-map editor.
A song map lists one song's timed lyric lines, its audio file, and the license
of both. This package is meant to outlive the PoC.

## Public API

```ts
import { validateSongMap, songMapSchema, type SongMap } from '@lingolyrics/song-map';

const result = validateSongMap(JSON.parse(text));
if (result.ok) {
  play(result.map); // typed as SongMap
} else {
  result.errors.forEach((e) => console.log(e.path, e.message));
}
```

| Export                                              | Description                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `validateSongMap(data: unknown): ValidationResult`  | Checks the schema, then the rules below. Returns `{ ok: true, map }` or `{ ok: false, errors }`. |
| `songMapSchema`                                     | The JSON Schema object, for editors or other validators.                                         |
| `SongMap`, `Line`, `Word`, `RightsEntry`, `License` | TypeScript types matching the schema.                                                            |
| `SongMapError`, `ValidationResult`                  | Validator result types. `path` is a JSON pointer such as `/lines/2/endMs`.                       |

## Format (schema version 1.0.0)

The source of truth is [`schema/song-map.schema.json`](schema/song-map.schema.json)
(JSON Schema 2020-12). In short:

- `schemaVersion`: readers accept any `1.x.y`
- `id`, `title`, `artist`, and `language` (a BCP 47 tag, e.g. `ja`)
- `audio`: `{ file, durationMs }`, where `file` is relative to the map file
- `rights.lyrics` and `rights.audio`: `{ license, source }`. The license must
  be one of `MIT`, `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `PUBLIC-DOMAIN`, or
  `PLACEHOLDER` (content still pending). Anything else, such as "All rights
  reserved", fails validation. Add a license to the list only after the team
  has checked that it allows redistribution in this MIT repo.
- `lines[]`: `{ id, startMs, endMs, text, translation?, words? }`, with times in
  whole milliseconds
- `words[]` (optional): `{ start, end, surface, reading?, romaji?, gloss? }`, with
  UTF-16 offsets into `text`. This is the R2 fallback: segmentation done in the
  editor and checked by the creator.

Once the schema passes, the validator checks rules JSON Schema can't express.
They run only on maps with the right shape, so a map with schema errors
reports those first, and the timing and word errors appear on the next run.
Within each stage, every problem is reported, not just the first.

- `endMs` is after `startMs`, and no line ends after the audio does
- lines are in time order and don't overlap
- line ids are unique
- word offsets fall inside the line, words don't overlap, and each `surface`
  equals `text.slice(start, end)`

## Notes

- `types.ts` is written by hand to match the schema. Change both together; the
  tests in `test/packages/song-map` catch most drift.
- Import package code from the package root (`@lingolyrics/song-map`). ESLint
  rejects deep imports such as `@lingolyrics/song-map/src/validate`.
- The validator compiles the schema with Ajv, which generates code at runtime.
  It compiles on the first `validateSongMap` call, not on import, so code that
  only needs the types or `songMapSchema` never runs Ajv. Whether Ajv works
  under Hermes in Expo Go is checked in phase 4. If it doesn't, the fallback is
  Ajv's standalone mode, which compiles the validator at build time.

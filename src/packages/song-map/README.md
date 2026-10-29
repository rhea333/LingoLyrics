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
  result.errors.forEach((e) => console.log(e.path, e.message)); // every problem, not just the first
}
```

| Export                                             | Description                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `validateSongMap(data: unknown): ValidationResult` | Checks the schema, then the rules below. Returns `{ ok: true, map }` or `{ ok: false, errors }`. |
| `songMapSchema`                                    | The JSON Schema object, for editors or other validators.                                         |
| `SongMap`, `Line`, `Word`, `RightsEntry`           | TypeScript types matching the schema.                                                            |
| `SongMapError`, `ValidationResult`                 | Validator result types. `path` is a JSON pointer such as `/lines/2/endMs`.                       |

## Format (schema version 1.0.0)

The source of truth is [`schema/song-map.schema.json`](schema/song-map.schema.json)
(JSON Schema 2020-12). In short:

- `schemaVersion`: readers accept any `1.x.y`
- `id`, `title`, `artist`, and `language` (a BCP 47 tag, e.g. `ja`)
- `audio`: `{ file, durationMs }`, where `file` is relative to the map file
- `rights.lyrics` and `rights.audio`: `{ license, source }`. The license is an
  SPDX id, `PUBLIC-DOMAIN`, or `PLACEHOLDER`. Rights are required so that
  unlicensed content can't slip into the repo.
- `lines[]`: `{ id, startMs, endMs, text, translation?, words? }`, with times in
  whole milliseconds
- `words[]` (optional): `{ start, end, surface, reading?, romaji?, gloss? }`, with
  UTF-16 offsets into `text`. This is the R2 fallback: segmentation done in the
  editor and checked by the creator.

On top of the schema, the validator checks rules JSON Schema can't express:

- `endMs` is after `startMs`, and no line ends after the audio does
- lines are in time order and don't overlap
- line ids are unique
- word offsets fall inside the line, words don't overlap, and each `surface`
  equals `text.slice(start, end)`

## Notes

- `types.ts` is written by hand to match the schema. Change both together; the
  tests in `test/packages/song-map` catch most drift.
- The validator compiles the schema with Ajv, which generates code at runtime.
  Whether that works under Hermes in Expo Go is checked in phase 4. If it
  doesn't, the fallback is Ajv's standalone mode, which compiles the validator
  at build time.

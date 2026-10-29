# @lingolyrics/lang

Splits Japanese lyric lines into selectable words, each with a reading and
romaji (risk R2). It wraps [kuromoji.js](https://github.com/takuyaa/kuromoji.js)
and its IPADIC dictionary. Kuromoji splits text into morphemes (降っ / て /
いる). This package merges them back into learner-sized words (降っている)
using the rules in
[`fixtures/gold/GUIDELINE.md`](../../fixtures/gold/GUIDELINE.md).

## Public API

```ts
import { loadSegmenter } from '@lingolyrics/lang';

const segmenter = await loadSegmenter(dicPath); // ~1 s on a laptop, build once
segmenter.segment('君に会いたかった');
// [ { surface: '君', start: 0, end: 1, reading: 'キミ', romaji: 'kimi', pos: '名詞', baseForm: '君' },
//   { surface: 'に', ... romaji: 'ni' },
//   { surface: '会いたかった', start: 2, end: 8, reading: 'アイタカッタ', romaji: 'aitakatta',
//     pos: '動詞', baseForm: '会う' } ]
```

| Export                                       | Description                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadSegmenter(dicPath): Promise<Segmenter>` | Loads the kuromoji dictionary from `dicPath` (in Node: `node_modules/kuromoji/dict`).                                                                                         |
| `createSegmenter(tokenizer): Segmenter`      | Wraps any object with `tokenize(text): Morpheme[]`, for tests or another dictionary loader.                                                                                   |
| `Segmenter.segment(line): Token[]`           | Words in order. Punctuation and spaces are left out.                                                                                                                          |
| `Token`                                      | `surface`, `start`/`end` (UTF-16 offsets into the line), `reading` (katakana, `''` if unknown), `romaji`, `pos`, and `baseForm` (the dictionary form, used as the Anki term). |
| `mergeMorphemes`, `attaches`                 | The merge rules on their own.                                                                                                                                                 |
| `morphemeReading`, `wordRomaji`              | The reading and romaji rules on their own.                                                                                                                                    |
| `goldSpans`, `scoreLine`, `summarize`        | R2 scoring: exact-span word matches against a gold set, pooled over lines. Used by `npm run poc:r2`.                                                                          |

## Romanization

wanakana converts kuromoji's katakana _reading_:

- The romaji follows the spelling, so 東京 becomes `toukyou` and コーヒー becomes
  `koohii`. Every romaji string maps back to kana. Rhea, as language owner,
  can switch to Hepburn macrons (`tōkyō`) in `romaji.ts` if the team prefers.
- The particles は / へ / を come out as `wa` / `e` / `o`, the way they are
  pronounced.
- Each word is converted in one go, so a small っ that ends one morpheme doubles
  the next consonant (会いたかった becomes `aitakatta`).
- ん before a vowel becomes `n'` (原因 becomes `gen'in`).
- Unknown Latin words such as `Baby` are kept unchanged. Any other unknown word
  gets an empty reading and empty romaji.

## Known limits

- Kuromoji ships IPADIC from 2007 and hasn't been updated since 2018. Lyric
  slang and new words come out as unknown or wrong.
- Example: 夢を見ていたんだ comes out as 見て / いたん (read as 痛む, "to
  hurt") / だ. A test documents this miss.
- The dictionary is 17 MB gzipped and takes about 1 s to load on a laptop. On a
  phone it is the main threat to the "ready in 3 s" criterion. Phase 4
  measures it in the learner app, and the dictionary has to be loaded through
  Expo assets there.

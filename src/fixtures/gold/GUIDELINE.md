# Gold segmentation guideline (R2)

These rules define what counts as one **word** in `ja-20-lines.json`. R2 passes
when at least 90% of the gold words come out of the segmenter with exactly the
same start and end.

The unit is roughly what a learner would tap to look up, not kuromoji's
morphemes. The segmenter's merge rules
([`packages/lang/src/merge.ts`](../../packages/lang/src/merge.ts)) implement the
same list, so change both together.

## Rules

1. **Verbs and adjectives keep their endings.** Auxiliaries, conjugation, and
   the connective て/で/ば stay attached.
   降っている, 会いたかった, 飲みません, 忘れられない, 食べよう, 楽しくない
2. **て/で/ば plus a helper verb is one word.** This covers いる, しまう, くる,
   なる and similar after て/で/ば.
   降っている, 食べてしまった, しなければならない
3. **Particles are separate words.** This includes は, が, を, に, へ, で, の,
   も, と, から, まで, and the sentence-final か, よ, ね.
   君 / に / 会いたかった
4. **Noun suffixes attach to the noun.** たち, さん, 中, and counters such as
   一度 or 三人.
   私たち, もう一度
5. **Prefixes attach to the next word.** お and ご.
   お弁当
6. **Noun + する is two words.** The する chain follows rule 1.
   勉強 / しなければならない
7. **Na-adjective + だ is two words.** The copula だ/です after a noun or
   na-adjective is separate.
   綺麗 / だ / ね
8. **Nominalizer ん/の before だ is separate.**
   見ていた / ん / だ
9. **Punctuation and spaces are not words.** Leave them out of the list.
10. **Latin-script words are one word each.**
    Baby

## File format

```json
{
  "status": "placeholder | draft | checked | verified",
  "checkedBy": "Rhea Gokhale",
  "checkedOn": "2026-11-05",
  "reviewedBy": "Raymond Ma",
  "reviewedOn": "2026-11-07",
  "songMap": "../songs/ja/poc-test-song.songmap.json",
  "lines": [
    {
      "lineId": "l01",
      "text": "今日は雨が降っている",
      "words": ["今日", "は", "雨", "が", "降っている"]
    }
  ]
}
```

- `text` must equal the song map line with the same `lineId`.
- `words`, in order, must cover the whole `text`, skipping only punctuation
  and spaces. `npm run poc:r2` rejects the file otherwise, which catches typos.
- Write the gold words **from the guideline, without looking at the
  segmenter's output.** Otherwise the gold set just copies the tool.

## Status workflow

| Status        | Meaning                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `placeholder` | No real lyrics yet. `poc:r2` refuses to score.                                                     |
| `draft`       | Lyrics and words written, not yet checked.                                                         |
| `checked`     | Rhea has checked every line against this guideline (set `checkedOn`).                              |
| `verified`    | Raymond has reviewed Rhea's check (set `reviewedOn`). Only this status can produce an R2 **PASS**. |

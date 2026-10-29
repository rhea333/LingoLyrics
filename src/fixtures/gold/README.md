# R2 gold segmentation

| File               | Content                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `ja-20-lines.json` | Gold words for the 20 lines of the PoC test song. **Placeholder** until the team-written lyrics arrive. |
| `GUIDELINE.md`     | What counts as one word, the file format, and the check/review workflow.                                |

Rhea checks the gold words and Raymond reviews them. `npm run poc:r2` reports
**PASS** only when `status` is `verified`. Until then it prints the numbers
labelled `NOT FINAL`.

The lyrics are team-written and released under the repo's MIT license, the
same as the song map.

`test/packages/lang/sample-gold.json` is a separate developer sample used to
exercise the scoring before the real lines exist. Its author wrote the gold
words after seeing the segmenter's output, so its score is **not evidence for
R2**.

import { join } from 'node:path';
import { loadSegmenter, type Segmenter } from '@lingolyrics/lang';

// real kuromoji dictionary, about 1 s to load
const dicPath = join(__dirname, '../../../src/node_modules/kuromoji/dict');

let segmenter: Segmenter;
beforeAll(async () => {
  segmenter = await loadSegmenter(dicPath);
}, 30000);

const words = (line: string) => segmenter.segment(line).map((t) => t.surface);

describe('segment, merge rules from GUIDELINE.md', () => {
  it.each([
    // rule 1: verb endings stay on
    ['君に会いたかった', ['君', 'に', '会いたかった']],
    ['コーヒーを飲みませんか', ['コーヒー', 'を', '飲みません', 'か']],
    ['忘れられない', ['忘れられない']],
    // rule 2: te-form + helper verb
    ['今日は雨が降っている', ['今日', 'は', '雨', 'が', '降っている']],
    // rule 4 and 5: suffix, prefix
    ['私たちは走り出した', ['私たち', 'は', '走り出した']],
    ['お弁当を食べよう', ['お弁当', 'を', '食べよう']],
    // rule 6 and 7: suru noun, copula
    ['勉強しなければならない', ['勉強', 'しなければならない']],
    ['東京の夜は綺麗だね', ['東京', 'の', '夜', 'は', '綺麗', 'だ', 'ね']],
    // rule 9 and 10: punctuation dropped, latin kept
    ['もう一度、笑って', ['もう一度', '笑って']],
    ['Babyずっと一緒にいようよ', ['Baby', 'ずっと', '一緒', 'に', 'いよう', 'よ']],
  ])('%s', (line, expected) => {
    expect(words(line)).toEqual(expected);
  });

  it('known miss: kuromoji reads いたん as 痛む in 見ていたんだ', () => {
    // documents a real lyric failure, flip this test if a fix lands
    expect(words('夢を見ていたんだ')).not.toEqual(['夢', 'を', '見ていた', 'ん', 'だ']);
  });
});

describe('token fields', () => {
  it('gives offsets that slice back to the surface', () => {
    const line = 'もう一度、笑って';
    segmenter.segment(line).forEach((t) => {
      expect(line.slice(t.start, t.end)).toBe(t.surface);
    });
  });

  it('gives reading, romaji and dictionary form', () => {
    const [, , verb] = segmenter.segment('君に会いたかった');
    expect(verb).toMatchObject({
      reading: 'アイタカッタ',
      romaji: 'aitakatta',
      baseForm: '会う',
      pos: '動詞',
    });
  });

  it('romanizes particles as spoken', () => {
    const romaji = segmenter.segment('今日は星へ愛を').map((t) => t.romaji);
    expect(romaji).toEqual(['kyou', 'wa', 'hoshi', 'e', 'ai', 'o']);
  });

  it('doubles the consonant after a small tsu across morphemes', () => {
    // たかっ + た, split by kuromoji, one word to us
    expect(segmenter.segment('会いたかった')[0]?.romaji).toBe('aitakatta');
    expect(segmenter.segment('降っている')[0]?.romaji).toBe('futteiru');
  });

  it('handles long vowels and n before a vowel', () => {
    expect(segmenter.segment('コーヒー')[0]?.romaji).toBe('koohii');
    expect(segmenter.segment('原因')[0]?.romaji).toBe("gen'in");
  });

  it('keeps latin words as they are, base form included', () => {
    expect(segmenter.segment('Baby')[0]).toMatchObject({ romaji: 'Baby', baseForm: 'Baby' });
  });

  it('returns nothing for an empty or punctuation-only line', () => {
    expect(segmenter.segment('')).toEqual([]);
    expect(segmenter.segment('、。！')).toEqual([]);
  });
});

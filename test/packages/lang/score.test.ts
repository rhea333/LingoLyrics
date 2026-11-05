import { goldSpans, scoreLine, summarize } from '@lingolyrics/lang';

describe('goldSpans', () => {
  it('finds each word in order', () => {
    expect(goldSpans('猫が好き', ['猫', 'が', '好き'])).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it('skips punctuation and spaces between words', () => {
    expect(goldSpans('もう、行く！', ['もう', '行く'])).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
    ]);
  });

  it('throws on a word that is not in the text', () => {
    expect(() => goldSpans('猫が好き', ['犬', 'が'])).toThrow('not found');
  });

  it('throws on an empty gold word', () => {
    expect(() => goldSpans('猫が好き', ['猫', '', 'が', '好き'])).toThrow('empty');
  });

  it('throws when real text is skipped, catches typos', () => {
    expect(() => goldSpans('猫が好き', ['猫', '好き'])).toThrow('skip');
    expect(() => goldSpans('猫が好き', ['猫', 'が'])).toThrow('cover');
  });
});

describe('scoreLine', () => {
  const text = '猫が好き';
  const gold = goldSpans(text, ['猫', 'が', '好き']);

  it('counts exact matches', () => {
    expect(scoreLine(text, gold, gold)).toEqual({
      goldWords: 3,
      predictedWords: 3,
      matched: 3,
      missed: [],
    });
  });

  it('needs both edges right, merged words count as misses', () => {
    const merged = [
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ];
    expect(scoreLine(text, gold, merged)).toMatchObject({ matched: 1, missed: ['猫', 'が'] });
  });
});

describe('summarize', () => {
  it('pools words across lines', () => {
    const s = summarize([
      { goldWords: 9, predictedWords: 9, matched: 9, missed: [] },
      { goldWords: 1, predictedWords: 2, matched: 0, missed: ['x'] },
    ]);
    // pooled 9/10, not the mean of 100% and 0%
    expect(s.accuracy).toBeCloseTo(0.9);
    expect(s.precision).toBeCloseTo(9 / 11);
  });

  it('returns 0 instead of NaN with no words', () => {
    expect(summarize([])).toMatchObject({ accuracy: 0, precision: 0 });
  });
});

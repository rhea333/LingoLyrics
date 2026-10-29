// r2 scoring: how many gold words the segmenter got exactly right

/** a word as a span of the line */
export interface Span {
  start: number;
  end: number;
}

/** score for one line */
export interface LineScore {
  goldWords: number;
  predictedWords: number;
  matched: number;
  /** gold words with no exact match in the output */
  missed: string[];
}

/** pooled score over many lines */
export interface ScoreSummary {
  lines: number;
  goldWords: number;
  predictedWords: number;
  matched: number;
  /** matched / goldWords, the r2 pass number */
  accuracy: number;
  /** matched / predictedWords */
  precision: number;
}

// characters a gold list may skip over
const SKIPPABLE = /[\s\p{P}\p{S}]/u;

/**
 * finds each gold word in the text, in order. throws if a word is missing or
 * if real text is skipped, so typos in the gold file get caught
 */
export function goldSpans(text: string, words: string[]): Span[] {
  let pos = 0;
  const spans = words.map((word) => {
    const start = text.indexOf(word, pos);
    if (start === -1) throw new Error(`gold word "${word}" not found after offset ${pos}`);
    const gap = text.slice(pos, start);
    if ([...gap].some((ch) => !SKIPPABLE.test(ch))) {
      throw new Error(`gold words skip "${gap}" before "${word}"`);
    }
    pos = start + word.length;
    return { start, end: pos };
  });
  const tail = text.slice(pos);
  if ([...tail].some((ch) => !SKIPPABLE.test(ch))) {
    throw new Error(`gold words do not cover "${tail}" at the end`);
  }
  return spans;
}

/** exact span match, a word only counts if both edges are right */
export function scoreLine(text: string, gold: Span[], predicted: Span[]): LineScore {
  const found = new Set(predicted.map((p) => `${p.start}:${p.end}`));
  const missed = gold.filter((g) => !found.has(`${g.start}:${g.end}`));
  return {
    goldWords: gold.length,
    predictedWords: predicted.length,
    matched: gold.length - missed.length,
    missed: missed.map((g) => text.slice(g.start, g.end)),
  };
}

/** pools word counts over lines, not an average of line percentages */
export function summarize(scores: LineScore[]): ScoreSummary {
  const sum = (f: (s: LineScore) => number) => scores.reduce((n, s) => n + f(s), 0);
  const goldWords = sum((s) => s.goldWords);
  const predictedWords = sum((s) => s.predictedWords);
  const matched = sum((s) => s.matched);
  return {
    lines: scores.length,
    goldWords,
    predictedWords,
    matched,
    accuracy: goldWords === 0 ? 0 : matched / goldWords,
    precision: predictedWords === 0 ? 0 : matched / predictedWords,
  };
}

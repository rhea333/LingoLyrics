import { isKana, toKatakana, toRomaji } from 'wanakana';

export interface Morpheme {
  surface_form: string;
  basic_form?: string;
  reading?: string;
  pos?: string;
  pos_detail_1?: string;
}

export interface WordToken {
  surface: string;
  baseForm: string;
  reading: string;
  romaji: string;
  start: number;
  end: number;
}

export interface Tokenizer {
  tokenize(text: string): Morpheme[];
}

const ATTACH_TO_PREDICATE = new Set(['て', 'で', 'ば']);
const PARTICLE_ROMAJI: Record<string, string> = { 'は': 'wa', 'へ': 'e', 'を': 'o' };

function readingOf(item: Morpheme): string {
  if (item.reading && item.reading !== '*') return item.reading;
  return isKana(item.surface_form) ? toKatakana(item.surface_form) : '';
}

function shouldAttach(group: Morpheme[], next: Morpheme): boolean {
  const head = group[0];
  if (!head) return false;
  if (head.pos === '接頭詞') return true;
  const predicate = head.pos === '動詞' || head.pos === '形容詞';
  if (predicate && next.pos === '助動詞') return true;
  if (predicate && next.pos === '助詞' && ATTACH_TO_PREDICATE.has(next.surface_form)) return true;
  return next.pos === '名詞' && next.pos_detail_1 === '接尾' && head.pos === '名詞';
}

function groupMorphemes(items: Morpheme[]): Morpheme[][] {
  const groups: Morpheme[][] = [];
  for (const item of items) {
    if (item.pos === '記号' || /^[\s\p{P}\p{S}]*$/u.test(item.surface_form)) continue;
    const last = groups.at(-1);
    if (last && shouldAttach(last, item)) last.push(item);
    else groups.push([item]);
  }
  return groups;
}

export function segmentLine(tokenizer: Tokenizer, line: string): WordToken[] {
  let cursor = 0;
  return groupMorphemes(tokenizer.tokenize(line)).map((group) => {
    const surface = group.map((item) => item.surface_form).join('');
    const start = line.indexOf(surface, cursor);
    const safeStart = start < 0 ? cursor : start;
    cursor = safeStart + surface.length;
    const reading = group.map(readingOf).join('');
    const first = group[0]!;
    const fixedParticle = group.length === 1 ? PARTICLE_ROMAJI[surface] : undefined;
    return {
      surface,
      baseForm: first.basic_form && first.basic_form !== '*' ? first.basic_form : first.surface_form,
      reading,
      romaji: fixedParticle ?? (reading ? toRomaji(reading) : surface.normalize('NFKC')),
      start: safeStart,
      end: safeStart + surface.length,
    };
  });
}

function spans(words: string[]): string[] {
  let cursor = 0;
  return words.map((word) => {
    const span = `${cursor}:${cursor + word.length}`;
    cursor += word.length;
    return span;
  });
}

export function scoreSegmentation(actual: WordToken[][], gold: string[][]) {
  let correct = 0;
  let total = 0;
  gold.forEach((goldLine, lineIndex) => {
    const expected = new Set(spans(goldLine));
    total += expected.size;
    for (const token of actual[lineIndex] ?? []) {
      if (expected.has(`${token.start}:${token.end}`)) correct += 1;
    }
  });
  const rate = total === 0 ? 0 : correct / total;
  return { correct, total, rate, passed: rate >= 0.9 };
}

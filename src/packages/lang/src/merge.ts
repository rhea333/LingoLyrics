import type { Morpheme } from './types';

// kuromoji splits finer than a learner thinks of words
// rules here match fixtures/gold/GUIDELINE.md, change both together

// connective particles that stay on the verb: 降って 行けば
const VERB_PARTICLES = new Set(['て', 'で', 'ば']);

function isPredicate(m: Morpheme): boolean {
  return m.pos === '動詞' || m.pos === '形容詞';
}

// same set goldSpans skips, keep in step with score.ts
const SKIPPABLE = /^[\s\p{P}\p{S}]*$/u;

// punctuation, symbols like ♪, spaces are not words
function isSkipped(m: Morpheme): boolean {
  return m.pos === '記号' || SKIPPABLE.test(m.surface_form);
}

/** true if m belongs on the end of the group instead of starting a new word */
export function attaches(group: Morpheme[], m: Morpheme): boolean {
  const last = group[group.length - 1];
  if (!last) return false;
  // お弁当: prefix sticks to whatever comes next
  if (last.pos === '接頭詞') return true;

  const head = group.find((x) => x.pos !== '接頭詞') ?? last;

  if (isPredicate(head)) {
    // 会いたかった 飲みません
    if (m.pos === '助動詞') return true;
    // 忘れられる
    if (m.pos === '動詞' && m.pos_detail_1 === '接尾') return true;
    // 降って
    if (m.pos === '助詞' && m.pos_detail_1 === '接続助詞' && VERB_PARTICLES.has(m.surface_form)) {
      return true;
    }
    // 降っている, only right after て/で/ば
    if (isPredicate(m) && m.pos_detail_1 === '非自立' && last.pos_detail_1 === '接続助詞') {
      return true;
    }
  }

  // 私たち, and 高さ where さ follows an adjective stem
  if (m.pos === '名詞' && m.pos_detail_1 === '接尾') {
    if (head.pos === '名詞' || last.pos === '形容詞') return true;
  }

  return false;
}

/** groups morphemes into words, punctuation dropped */
export function mergeMorphemes(morphemes: Morpheme[]): Morpheme[][] {
  const groups: Morpheme[][] = [];
  let current: Morpheme[] = [];

  morphemes.forEach((m) => {
    if (isSkipped(m)) {
      // punctuation ends the word
      if (current.length > 0) groups.push(current);
      current = [];
      return;
    }
    if (current.length > 0 && attaches(current, m)) {
      current.push(m);
    } else {
      if (current.length > 0) groups.push(current);
      current = [m];
    }
  });
  if (current.length > 0) groups.push(current);
  return groups;
}

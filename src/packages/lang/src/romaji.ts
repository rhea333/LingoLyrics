import { isKana, toKatakana, toRomaji } from 'wanakana';
import type { Morpheme } from './types';

// particles said differently than written
const PARTICLE_ROMAJI: Record<string, string> = { は: 'wa', へ: 'e', を: 'o' };

/** katakana reading of one morpheme, empty if kuromoji doesnt know it */
export function morphemeReading(m: Morpheme): string {
  if (m.reading && m.reading !== '*') return m.reading;
  // unknown but plain kana, read it as written
  if (isKana(m.surface_form)) return toKatakana(m.surface_form);
  return '';
}

// fixed romaji for particles and latin, undefined means use the reading
function fixedRomaji(m: Morpheme): string | undefined {
  if (m.pos === '助詞' && PARTICLE_ROMAJI[m.surface_form]) return PARTICLE_ROMAJI[m.surface_form];
  if (!morphemeReading(m)) {
    // latin like "Baby" stays as is, full-width Ｂａｂｙ too
    // anything else unknown gets nothing
    const ascii = m.surface_form.normalize('NFKC');
    return /^[\x20-\x7e]+$/.test(ascii) ? ascii : '';
  }
  return undefined;
}

/**
 * romaji for a word made of morphemes. spelling based (東京 -> toukyou) so it
 * maps back to kana, particles は へ を as wa e o.
 * kana is converted in runs, small っ needs the next sound: たかっ+た -> takatta
 */
export function wordRomaji(group: Morpheme[]): string {
  let out = '';
  let kana = '';
  group.forEach((m) => {
    const fixed = fixedRomaji(m);
    if (fixed === undefined) {
      kana += morphemeReading(m);
      return;
    }
    out += toRomaji(kana) + fixed;
    kana = '';
  });
  return out + toRomaji(kana);
}

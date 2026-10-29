import { builder } from 'kuromoji';
import { mergeMorphemes } from './merge';
import { morphemeReading, wordRomaji } from './romaji';
import type { Morpheme, Segmenter, Token, Tokenizer } from './types';

function toToken(group: Morpheme[]): Token {
  const first = group[0]!;
  const last = group[group.length - 1]!;
  const head = group.find((m) => m.pos !== '接頭詞') ?? first;
  const start = first.word_position - 1;
  const end = last.word_position - 1 + last.surface_form.length;
  return {
    surface: group.map((m) => m.surface_form).join(''),
    start,
    end,
    reading: group.map(morphemeReading).join(''),
    romaji: wordRomaji(group),
    pos: head.pos,
    // unknown words have basic_form '*'
    baseForm: head.basic_form === '*' ? head.surface_form : head.basic_form,
  };
}

/** wraps any tokenizer, handy for tests and other loaders */
export function createSegmenter(tokenizer: Tokenizer): Segmenter {
  return {
    segment: (line) => mergeMorphemes(tokenizer.tokenize(line)).map(toToken),
  };
}

/**
 * loads the kuromoji dictionary from dicPath and returns a segmenter.
 * slow, about 1 s on a laptop, build once and reuse
 */
export function loadSegmenter(dicPath: string): Promise<Segmenter> {
  return new Promise((resolve, reject) => {
    builder({ dicPath }).build((err, tokenizer) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(createSegmenter(tokenizer));
    });
  });
}

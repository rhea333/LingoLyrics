/** one kuromoji morpheme, only the fields we use */
export interface Morpheme {
  surface_form: string;
  /** part of speech, e.g. 名詞 動詞 助詞 */
  pos: string;
  pos_detail_1: string;
  basic_form: string;
  /** katakana, missing for unknown words */
  reading?: string | undefined;
  /** katakana as spoken, e.g. は -> ワ */
  pronunciation?: string | undefined;
  /** 1-based position in the input string */
  word_position: number;
}

/** anything that turns a line into morphemes, kuromoji in practice */
export interface Tokenizer {
  tokenize(text: string): Morpheme[];
}

/** one selectable word in a lyric line */
export interface Token {
  /** text as it appears in the line */
  surface: string;
  /** utf-16 offset into the line, inclusive */
  start: number;
  /** utf-16 offset, exclusive */
  end: number;
  /** katakana reading, empty if unknown */
  reading: string;
  romaji: string;
  /** part of speech of the head morpheme */
  pos: string;
  /** dictionary form of the head, e.g. 会う for 会いたかった */
  baseForm: string;
}

/** splits lyric lines into words */
export interface Segmenter {
  segment(line: string): Token[];
}

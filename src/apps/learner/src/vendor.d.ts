declare module 'kuromoji/src/loader/DictionaryLoader' {
  type Callback = (error: unknown, buffer: ArrayBuffer | null) => void;
  class DictionaryLoader {
    constructor(path: string);
    loadArrayBuffer(path: string, callback: Callback): void;
    load(callback: (error: unknown, dictionary: unknown) => void): void;
  }
  export = DictionaryLoader;
}

declare module 'kuromoji/src/Tokenizer' {
  import type { Tokenizer as TokenizerShape } from './core/segmentation';
  class Tokenizer implements TokenizerShape {
    constructor(dictionary: unknown);
    tokenize(text: string): ReturnType<TokenizerShape['tokenize']>;
  }
  export = Tokenizer;
}

declare module 'zlibjs/bin/gunzip.min.js' {
  export interface ZlibApi {
    Gunzip: new (data: Uint8Array) => { decompress(): Uint8Array };
  }
  export const Zlib: ZlibApi | undefined;
}

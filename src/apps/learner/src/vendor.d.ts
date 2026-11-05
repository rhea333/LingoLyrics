// kuromoji internals and zlibjs have no types, only what we call

declare module 'kuromoji/src/loader/DictionaryLoader' {
  type Callback = (err: unknown, buffer: ArrayBuffer | null) => void;
  class DictionaryLoader {
    constructor(dicPath: string);
    loadArrayBuffer: (path: string, callback: Callback) => void;
    load(callback: (err: unknown, dic: unknown) => void): void;
  }
  export = DictionaryLoader;
}

declare module 'kuromoji/src/Tokenizer' {
  import type { IpadicFeatures } from 'kuromoji';

  class Tokenizer {
    constructor(dic: unknown);
    tokenize(text: string): IpadicFeatures[];
  }
  export = Tokenizer;
}

// zlibjs puts Zlib on `this`, so the export may be missing, see kuromoji-rn.ts
declare module 'zlibjs/bin/gunzip.min.js' {
  export interface ZlibApi {
    Gunzip: new (data: Uint8Array) => { decompress(): Uint8Array };
  }
  export const Zlib: ZlibApi | undefined;
}

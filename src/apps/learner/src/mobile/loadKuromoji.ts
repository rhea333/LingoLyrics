import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import DictionaryLoader from 'kuromoji/src/loader/DictionaryLoader';
import KuromojiTokenizer from 'kuromoji/src/Tokenizer';
import * as zlibExports from 'zlibjs/bin/gunzip.min.js';
import type { Tokenizer } from '../core/segmentation';

type ZlibApi = zlibExports.ZlibApi;

/* eslint-disable global-require */
const DICTIONARY: Record<string, number> = {
  'base.dat.gz': require('kuromoji/dict/base.dat.gz'),
  'check.dat.gz': require('kuromoji/dict/check.dat.gz'),
  'tid.dat.gz': require('kuromoji/dict/tid.dat.gz'),
  'tid_pos.dat.gz': require('kuromoji/dict/tid_pos.dat.gz'),
  'tid_map.dat.gz': require('kuromoji/dict/tid_map.dat.gz'),
  'cc.dat.gz': require('kuromoji/dict/cc.dat.gz'),
  'unk.dat.gz': require('kuromoji/dict/unk.dat.gz'),
  'unk_pos.dat.gz': require('kuromoji/dict/unk_pos.dat.gz'),
  'unk_map.dat.gz': require('kuromoji/dict/unk_map.dat.gz'),
  'unk_char.dat.gz': require('kuromoji/dict/unk_char.dat.gz'),
  'unk_compat.dat.gz': require('kuromoji/dict/unk_compat.dat.gz'),
  'unk_invoke.dat.gz': require('kuromoji/dict/unk_invoke.dat.gz'),
};
/* eslint-enable global-require */

export interface LoadedTokenizer {
  tokenizer: Tokenizer;
  dictionaryLoadMs: number;
}

let cached: Promise<LoadedTokenizer> | undefined;

function zlib(): ZlibApi {
  const api = zlibExports.Zlib ?? (globalThis as { Zlib?: ZlibApi }).Zlib;
  if (!api?.Gunzip) throw new Error('The dictionary decompressor did not load.');
  return api;
}

async function buildTokenizer(): Promise<LoadedTokenizer> {
  const started = performance.now();
  const assets = await Asset.loadAsync(Object.values(DICTIONARY));
  const names = Object.keys(DICTIONARY);
  const uriByName = new Map(names.map((name, index) => [name, assets[index]?.localUri]));
  const loader = new DictionaryLoader('dict/');
  const { Gunzip } = zlib();

  loader.loadArrayBuffer = (path, callback) => {
    const name = path.split('/').at(-1) ?? '';
    const uri = uriByName.get(name);
    if (!uri) {
      callback(new Error(`Missing bundled dictionary file: ${name}`), null);
      return;
    }
    new File(uri).bytes().then(
      (bytes) => callback(null, new Gunzip(bytes).decompress().buffer as ArrayBuffer),
      (error: unknown) => callback(error, null),
    );
  };

  const dictionary = await new Promise<unknown>((resolve, reject) => {
    loader.load((error, result) => (error ? reject(error) : resolve(result)));
  });
  return {
    tokenizer: new KuromojiTokenizer(dictionary),
    dictionaryLoadMs: performance.now() - started,
  };
}

export function loadKuromoji(): Promise<LoadedTokenizer> {
  cached ??= buildTokenizer();
  return cached;
}

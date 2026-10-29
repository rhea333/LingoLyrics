// kuromoji in react native: its loader wants xhr + dict file names, expo
// assets come with hashed names. so we feed DictionaryLoader the bytes ourselves
import { createSegmenter, type Segmenter } from '@lingolyrics/lang';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import DictionaryLoader from 'kuromoji/src/loader/DictionaryLoader';
import KuromojiTokenizer from 'kuromoji/src/Tokenizer';
// real file name, the package has no index
// eslint-disable-next-line import/extensions
import { Zlib } from 'zlibjs/bin/gunzip.min.js';

/* eslint-disable global-require */
const DICT_FILES: Record<string, number> = {
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

/** where the dictionary load time went, ms */
export interface DictTimings {
  /** getting asset files onto the phone. in expo go this is a download from metro */
  assetsMs: number;
  /** read + gunzip + kuromoji build, wall time */
  buildMs: number;
  /** gunzip time summed over files, part of buildMs */
  gunzipMs: number;
}

/** loads kuromoji from bundled assets, returns a lang segmenter */
export async function loadRnSegmenter(): Promise<{ segmenter: Segmenter; timings: DictTimings }> {
  const t0 = performance.now();
  const names = Object.keys(DICT_FILES);
  const assets = await Asset.loadAsync(Object.values(DICT_FILES));
  const uriByName = new Map(names.map((name, i) => [name, assets[i]?.localUri]));
  const t1 = performance.now();

  let gunzipMs = 0;
  const loader = new DictionaryLoader('dict/');
  // kuromoji joins dicPath + name, we only need the name back
  loader.loadArrayBuffer = (path, callback) => {
    const name = path.split('/').pop() ?? '';
    const uri = uriByName.get(name);
    if (!uri) {
      callback(new Error(`no bundled asset for ${name}`), null);
      return;
    }
    new File(uri).bytes().then(
      (bytes) => {
        const g0 = performance.now();
        const out = new Zlib.Gunzip(bytes).decompress();
        gunzipMs += performance.now() - g0;
        callback(null, out.buffer as ArrayBuffer);
      },
      (err: unknown) => callback(err, null),
    );
  };

  const dic = await new Promise<unknown>((resolve, reject) => {
    loader.load((err, d) => (err ? reject(err) : resolve(d)));
  });
  const segmenter = createSegmenter(new KuromojiTokenizer(dic));
  return {
    segmenter,
    timings: { assetsMs: t1 - t0, buildMs: performance.now() - t1, gunzipMs },
  };
}

// kuromoji in react native: its loader wants xhr + dict file names, expo
// assets come with hashed names. so we feed DictionaryLoader the bytes ourselves
import { createSegmenter, type Segmenter } from '@lingolyrics/lang';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import DictionaryLoader from 'kuromoji/src/loader/DictionaryLoader';
import KuromojiTokenizer from 'kuromoji/src/Tokenizer';
/* eslint-disable global-require */
const DICT_FILES: Record<string, number> = {
  'base.dat.gz': require('../assets/dict/base.dat'),
  'check.dat.gz': require('../assets/dict/check.dat'),
  'tid.dat.gz': require('../assets/dict/tid.dat'),
  'tid_pos.dat.gz': require('../assets/dict/tid_pos.dat'),
  'tid_map.dat.gz': require('../assets/dict/tid_map.dat'),
  'cc.dat.gz': require('../assets/dict/cc.dat'),
  'unk.dat.gz': require('../assets/dict/unk.dat'),
  'unk_pos.dat.gz': require('../assets/dict/unk_pos.dat'),
  'unk_map.dat.gz': require('../assets/dict/unk_map.dat'),
  'unk_char.dat.gz': require('../assets/dict/unk_char.dat'),
  'unk_compat.dat.gz': require('../assets/dict/unk_compat.dat'),
  'unk_invoke.dat.gz': require('../assets/dict/unk_invoke.dat'),
};
/* eslint-enable global-require */

/** where the dictionary load time went, ms */
export interface DictTimings {
  /** getting asset files onto the phone. in expo go this is a download from metro */
  assetsMs: number;
  /** read + kuromoji build, wall time */
  buildMs: number;
  /** zero: dictionary decompression happens at build time */
  gunzipMs: number;
}

/** loads kuromoji from bundled assets, returns a lang segmenter */
export async function loadRnSegmenter(): Promise<{ segmenter: Segmenter; timings: DictTimings }> {
  const t0 = performance.now();
  const names = Object.keys(DICT_FILES);
  const assets = await Asset.loadAsync(Object.values(DICT_FILES));
  const uriByName = new Map(names.map((name, i) => [name, assets[i]?.localUri]));
  const t1 = performance.now();

  const loader = new DictionaryLoader('dict/');
  // kuromoji joins dicPath + name, we only need the name back
  loader.loadArrayBuffer = (path, callback) => {
    const name = path.split('/').pop() ?? '';
    const uri = uriByName.get(name);
    if (!uri) {
      callback(new Error(`no bundled asset for ${name}`), null);
      return;
    }
    new File(uri).arrayBuffer().then(
      (buffer) => callback(null, buffer),
      (err: unknown) => callback(err, null),
    );
  };

  const dic = await new Promise<unknown>((resolve, reject) => {
    loader.load((err, d) => (err ? reject(err) : resolve(d)));
  });
  const segmenter = createSegmenter(new KuromojiTokenizer(dic));
  return {
    segmenter,
    timings: { assetsMs: t1 - t0, buildMs: performance.now() - t1, gunzipMs: 0 },
  };
}

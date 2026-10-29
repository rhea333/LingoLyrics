// mirrors schema/song-map.schema.json, keep both in step

/** where a piece of content came from and its license */
export interface RightsEntry {
  /** spdx id, PUBLIC-DOMAIN, or PLACEHOLDER */
  license: string;
  source: string;
}

/** one word in a line, offsets into line.text */
export interface Word {
  /** utf-16 offset, inclusive */
  start: number;
  /** utf-16 offset, exclusive */
  end: number;
  surface: string;
  reading?: string;
  romaji?: string;
  gloss?: string;
}

/** one timed lyric line */
export interface Line {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  translation?: string;
  words?: Word[];
}

/** a whole song map file */
export interface SongMap {
  $schema?: string;
  schemaVersion: string;
  id: string;
  title: string;
  artist: string;
  language: string;
  audio: { file: string; durationMs: number };
  rights: { lyrics: RightsEntry; audio: RightsEntry };
  lines: Line[];
}

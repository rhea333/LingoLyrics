import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import schema from '../schema/song-map.schema.json';
import type { SongMap } from './types';

/** one problem found in a song map */
export interface SongMapError {
  /** json pointer to the bad value, e.g. /lines/2/endMs */
  path: string;
  message: string;
}

/** result of validateSongMap, map only set when ok */
export type ValidationResult = { ok: true; map: SongMap } | { ok: false; errors: SongMapError[] };

// compiled on first use, so importing just the types costs nothing
let checkSchema: ValidateFunction<SongMap> | undefined;
function getCheckSchema(): ValidateFunction<SongMap> {
  checkSchema ??= new Ajv2020({ allErrors: true }).compile<SongMap>(schema);
  return checkSchema;
}

function fromAjv(e: ErrorObject): SongMapError {
  const path = e.instancePath || '/';
  // name the unknown field, ajv leaves it in params
  if (e.keyword === 'additionalProperties') {
    return { path, message: `unknown field "${String(e.params.additionalProperty)}"` };
  }
  return { path, message: e.message ?? 'invalid' };
}

// rules json schema cant express: ordering, overlap, offsets
function checkSemantics(map: SongMap): SongMapError[] {
  const errors: SongMapError[] = [];
  const seen = new Set<string>();

  map.lines.forEach((line, i) => {
    const at = `/lines/${i}`;
    if (seen.has(line.id)) {
      errors.push({ path: `${at}/id`, message: `duplicate line id ${line.id}` });
    }
    seen.add(line.id);

    if (line.endMs <= line.startMs) {
      errors.push({ path: `${at}/endMs`, message: 'endMs must be after startMs' });
    }
    if (line.endMs > map.audio.durationMs) {
      errors.push({ path: `${at}/endMs`, message: 'line ends after the audio does' });
    }

    // lines in time order, no overlap
    const prev = map.lines[i - 1];
    if (prev && line.startMs < prev.endMs) {
      errors.push({ path: `${at}/startMs`, message: `starts before line ${prev.id} ends` });
    }

    let lastEnd = 0;
    line.words?.forEach((w, j) => {
      const wAt = `${at}/words/${j}`;
      if (w.end <= w.start || w.end > line.text.length) {
        errors.push({ path: wAt, message: 'word offsets outside the line text' });
        return;
      }
      if (w.start < lastEnd) {
        errors.push({ path: wAt, message: 'words overlap or are out of order' });
      }
      if (line.text.slice(w.start, w.end) !== w.surface) {
        errors.push({ path: `${wAt}/surface`, message: 'surface does not match line text' });
      }
      lastEnd = w.end;
    });
  });

  return errors;
}

/**
 * checks data against the song map schema, then timing and offset rules.
 * schema errors come back all at once. timing/word rules only run once the
 * schema passes, they need the right shape to check
 */
export function validateSongMap(data: unknown): ValidationResult {
  const check = getCheckSchema();
  if (!check(data)) {
    return { ok: false, errors: (check.errors ?? []).map(fromAjv) };
  }
  const errors = checkSemantics(data);
  return errors.length === 0 ? { ok: true, map: data } : { ok: false, errors };
}

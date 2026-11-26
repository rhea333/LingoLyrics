// r2: open the lesson, show each line as tappable words with romaji, time it
import type { Segmenter, Token } from '@lingolyrics/lang';
import type { SongMap } from '@lingolyrics/song-map';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadRnSegmenter, type DictTimings } from '../kuromoji-rn';

const READY_LIMIT_MS = 3000;

// kept across screen visits, second open is the warm case
let cached: Promise<{ segmenter: Segmenter; timings: DictTimings }> | undefined;

type Lesson =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; lines: Token[][]; timings: DictTimings; segmentMs: number; warm: boolean };

export function R2Lesson({
  map,
  onSelect,
}: {
  map: SongMap;
  onSelect?: (token: Token, lineText: string) => void;
}) {
  // clock starts when the screen mounts
  const openedAt = useRef(performance.now());
  const [lesson, setLesson] = useState<Lesson>({ phase: 'loading' });
  const [readyMs, setReadyMs] = useState<number | null>(null);
  const [selected, setSelected] = useState<Token | null>(null);

  useEffect(() => {
    const warm = cached !== undefined;
    cached ??= loadRnSegmenter();
    cached.then(
      ({ segmenter, timings }) => {
        const s0 = performance.now();
        const lines = map.lines.map((l) => segmenter.segment(l.text));
        setLesson({ phase: 'ready', lines, timings, segmentMs: performance.now() - s0, warm });
      },
      (e: unknown) => {
        cached = undefined;
        setLesson({ phase: 'error', message: String((e as Error).message ?? e) });
      },
    );
  }, [map]);

  // ready = first commit with words on screen, not just data in memory
  useEffect(() => {
    if (lesson.phase !== 'ready' || readyMs !== null) return;
    const ms = performance.now() - openedAt.current;
    setReadyMs(ms);
    console.log(
      `R2_LESSON_READY ${JSON.stringify({ readyMs: ms, warm: lesson.warm, ...lesson.timings, segmentMs: lesson.segmentMs })}`,
    );
  }, [lesson, readyMs]);

  if (lesson.phase === 'loading') return <Text>Loading dictionary…</Text>;
  if (lesson.phase === 'error')
    return <Text style={styles.bad}>Dictionary failed: {lesson.message}</Text>;

  const { timings } = lesson;
  // asset download only happens in expo go dev, a real build ships them in the app
  const excludingDownload =
    readyMs === null ? null : readyMs - (lesson.warm ? 0 : timings.assetsMs);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>R2 lesson</Text>
      {readyMs !== null && excludingDownload !== null ? (
        <Text style={excludingDownload <= READY_LIMIT_MS ? styles.good : styles.bad}>
          ready in {(readyMs / 1000).toFixed(2)} s ({lesson.warm ? 'warm' : 'cold'}), without asset
          download {(excludingDownload / 1000).toFixed(2)} s · limit 3 s
        </Text>
      ) : null}
      {!lesson.warm ? (
        <Text style={styles.small}>
          assets {timings.assetsMs.toFixed(0)} ms · build {timings.buildMs.toFixed(0)} ms (gunzip{' '}
          {timings.gunzipMs.toFixed(0)}) · segment {lesson.segmentMs.toFixed(0)} ms
        </Text>
      ) : null}
      {selected ? (
        <Text style={styles.selected}>
          {selected.surface} · {selected.reading || '?'} · {selected.romaji || '?'} ·{' '}
          {selected.baseForm}
        </Text>
      ) : null}
      <ScrollView>
        {lesson.lines.map((tokens, i) => (
          <View key={map.lines[i]!.id} style={styles.line}>
            {tokens.map((t) => (
              <Pressable
                key={t.start}
                style={[styles.word, selected === t && styles.wordOn]}
                onPress={() => {
                  setSelected(t);
                  onSelect?.(t, map.lines[i]!.text);
                }}
              >
                <Text style={styles.surface}>{t.surface}</Text>
                <Text style={styles.romaji}>{t.romaji}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  good: { color: '#070' },
  bad: { color: '#a00' },
  small: { fontSize: 12, color: '#666' },
  selected: { fontSize: 16, padding: 6, backgroundColor: '#eef' },
  line: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 6 },
  word: { paddingHorizontal: 4, paddingVertical: 2, marginRight: 2, borderRadius: 4 },
  wordOn: { backgroundColor: '#ffe680' },
  surface: { fontSize: 18 },
  romaji: { fontSize: 11, color: '#666' },
});

// r1: play the song, highlight lines from the song map, log each line change
import type { SongMap } from '@lingolyrics/song-map';
import { analyzeTimingLog, LineTracker, type TimingLog } from '@lingolyrics/sync';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { songAudio } from '../song';

// ask for status updates every 50 ms, default is 500
const UPDATE_INTERVAL_MS = 50;

export function R1Sync({ map }: { map: SongMap }) {
  const player = useAudioPlayer(songAudio, { updateInterval: UPDATE_INTERVAL_MS });
  const tracker = useMemo(() => new LineTracker(map.lines), [map]);
  const startedAt = useRef(new Date().toISOString());
  const [active, setActive] = useState(-1);
  const [positionMs, setPositionMs] = useState(0);
  const [changeCount, setChangeCount] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    // play even with the ringer switch on silent
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      const pos = status.currentTime * 1000;
      const change = tracker.update(pos, performance.now());
      setPositionMs(pos);
      setActive(tracker.activeIndex);
      if (change) setChangeCount(tracker.changes.length);
    });
    return () => sub.remove();
  }, [player, tracker]);

  const restart = async () => {
    player.pause();
    await player.seekTo(0);
    tracker.reset();
    startedAt.current = new Date().toISOString();
    setChangeCount(0);
    setNote('');
    player.play();
  };

  const shareLog = async () => {
    const log: TimingLog = {
      version: 1,
      songId: map.id,
      device: `${Platform.OS} ${String(Platform.Version)}`,
      updateIntervalMs: UPDATE_INTERVAL_MS,
      startedAt: startedAt.current,
      changes: [...tracker.changes],
    };
    const json = JSON.stringify(log, null, 2);
    // metro console gets a copy too, in case sharing fails
    console.log(`R1_TIMING_LOG ${JSON.stringify(log)}`);
    const file = new File(Paths.document, `r1-log-${Date.now()}.json`);
    file.create();
    file.write(json);
    try {
      await shareAsync(file.uri, { mimeType: 'application/json' });
    } catch (e) {
      setNote(`share failed, log is in the metro console: ${(e as Error).message}`);
    }
  };

  const report =
    changeCount > 0 ? analyzeTimingLog({ changes: tracker.changes } as TimingLog, map.lines) : null;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>R1 lyric sync</Text>
      <Text>
        {(positionMs / 1000).toFixed(2)} s · {changeCount}/{map.lines.length} line changes
        {report
          ? ` · ${report.withinTolerance}/${report.changes} within 0.5 s · last ${report.errorsMs[report.errorsMs.length - 1]?.toFixed(0)} ms`
          : ''}
      </Text>
      <View style={styles.buttons}>
        <Button title="Play from start" onPress={restart} />
        <Button title="Pause" onPress={() => player.pause()} />
        <Button title="Share log" onPress={shareLog} disabled={changeCount === 0} />
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <ScrollView>
        {map.lines.map((line, i) => (
          <Text key={line.id} style={[styles.line, i === active && styles.active]}>
            {line.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { color: '#a00' },
  line: { fontSize: 18, paddingVertical: 4, color: '#888' },
  active: { color: '#000', backgroundColor: '#ffe680', fontWeight: '600' },
});

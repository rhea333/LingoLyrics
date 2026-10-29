// poc shell, one screen per risk, no navigation library on purpose
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { R1Sync } from './src/screens/R1Sync';
import { R2Lesson } from './src/screens/R2Lesson';
import { loadSong } from './src/song';

type Screen = 'home' | 'r1' | 'r2';

const song = loadSong();

export function App() {
  const [screen, setScreen] = useState<Screen>('home');

  if (!song.ok) {
    // show it, this is also the ajv-under-hermes check
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={styles.bad}>Song map failed to load</Text>
        <Text>
          {typeof song.errors === 'string'
            ? song.errors
            : song.errors.map((e) => `${e.path} ${e.message}`).join('\n')}
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {screen === 'home' ? (
        <View style={styles.home}>
          <Text style={styles.title}>LingoLyrics PoC</Text>
          <Text>
            {song.map.title} · {song.map.lines.length} lines · song map valid (
            {song.validateMs.toFixed(0)} ms, ajv ok)
          </Text>
          <Button title="R1 lyric sync" onPress={() => setScreen('r1')} />
          <Button title="R2 lesson (segmentation)" onPress={() => setScreen('r2')} />
        </View>
      ) : (
        <>
          <Button title="‹ Back" onPress={() => setScreen('home')} />
          {screen === 'r1' ? <R1Sync map={song.map} /> : <R2Lesson map={song.map} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 60, paddingHorizontal: 16, backgroundColor: '#fff' },
  home: { gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  bad: { color: '#a00', fontSize: 18 },
});

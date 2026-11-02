import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { R1SyncScreen } from './src/screens/R1SyncScreen';
import { R2SegmentScreen } from './src/screens/R2SegmentScreen';

type Risk = 'R1' | 'R2';

export function App() {
  const [risk, setRisk] = useState<Risk>('R1');

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <Text style={styles.title}>LingoLyrics</Text>
      <View style={styles.tabs}>
        {(['R1', 'R2'] as const).map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setRisk(item)}
            style={[styles.tab, risk === item && styles.activeTab]}
          >
            <Text style={risk === item ? styles.activeTabText : undefined}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {risk === 'R1' ? <R1SyncScreen /> : <R2SegmentScreen onChooseWord={() => undefined} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  tab: { flex: 1, alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#aaa' },
  activeTab: { backgroundColor: '#222' },
  activeTabText: { color: '#fff', fontWeight: '700' },
});

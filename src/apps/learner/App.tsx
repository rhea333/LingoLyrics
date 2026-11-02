import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { R1SyncScreen } from './src/screens/R1SyncScreen';

export function App() {
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <Text style={styles.title}>LingoLyrics</Text>
      <R1SyncScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
});

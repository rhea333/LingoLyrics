import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { scoreSegmentation, segmentLine, type WordToken } from '../core/segmentation';
import { DEMO_LINES } from '../data/demoSong';
import { loadKuromoji } from '../mobile/loadKuromoji';

interface Props {
  onChooseWord(word: SelectedWord): void;
}

export interface SelectedWord {
  term: string;
  reading: string;
  translation: string;
  context: string;
}

export function R2SegmentScreen({ onChooseWord }: Props) {
  const [tokens, setTokens] = useState<WordToken[][]>([]);
  const [loadMs, setLoadMs] = useState<number>();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    loadKuromoji()
      .then(({ tokenizer, dictionaryLoadMs }) => {
        const segmentStarted = performance.now();
        const result = DEMO_LINES.map((line) => segmentLine(tokenizer, line.text));
        if (mounted) {
          setTokens(result);
          setLoadMs(dictionaryLoadMs + performance.now() - segmentStarted);
        }
      })
      .catch((reason: unknown) => mounted && setError((reason as Error).message));
    return () => { mounted = false; };
  }, []);

  const score = scoreSegmentation(tokens, DEMO_LINES.map((line) => line.gold));
  const ready = loadMs !== undefined;
  const passed = ready && loadMs <= 3000 && score.passed;

  return (
    <View style={styles.page}>
      <Text style={styles.heading}>R2 · segment Japanese lyrics</Text>
      <Text>kuromoji runs on the phone. Tap a word to use it in R3.</Text>
      {error ? <Text style={styles.fail}>ERROR: {error}</Text> : null}
      {!ready && !error ? <Text style={styles.pending}>Loading dictionary and 20 test lines…</Text> : null}
      {ready ? (
        <>
          <Text style={styles.metric}>
            {loadMs.toFixed(0)} ms · {score.correct}/{score.total} exact word spans · {(score.rate * 100).toFixed(1)}%
          </Text>
          <Text style={passed ? styles.pass : styles.fail}>
            {passed ? 'PASS' : 'FAIL'} (targets: at least 90% and at most 3 seconds)
          </Text>
          <Text style={styles.review}>Gold tokens are draft data and still require the team’s independent review.</Text>
        </>
      ) : null}
      <ScrollView>
        {tokens.map((lineTokens, lineIndex) => (
          <View key={DEMO_LINES[lineIndex]?.startMs} style={styles.line}>
            {lineTokens.map((token) => (
              <Pressable
                key={`${token.start}-${token.end}`}
                onPress={() => onChooseWord({
                  term: token.baseForm,
                  reading: token.reading,
                  translation: DEMO_LINES[lineIndex]?.translation ?? '',
                  context: DEMO_LINES[lineIndex]?.text ?? '',
                })}
                style={styles.token}
              >
                <Text style={styles.surface}>{token.surface}</Text>
                <Text style={styles.romaji}>{token.romaji}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 7 },
  heading: { fontSize: 19, fontWeight: '700' },
  metric: { fontWeight: '600' },
  pending: { color: '#885d00' },
  pass: { color: '#087830', fontWeight: '700' },
  fail: { color: '#a00000', fontWeight: '700' },
  review: { color: '#555', fontSize: 12 },
  line: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 7, borderBottomWidth: 1, borderColor: '#ddd' },
  token: { marginRight: 8, marginBottom: 5, padding: 4, backgroundColor: '#f1f1f1' },
  surface: { fontSize: 17 },
  romaji: { fontSize: 10, color: '#555' },
});

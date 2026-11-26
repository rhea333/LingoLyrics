// r3: send one selected word, its translation and lyric context to Anki
import { sendCardToAnki, type Flashcard } from '@lingolyrics/anki';
import { useEffect, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import {
  getAnkiDroidStatus,
  openAnkiDroid,
  sendToAnkiDroid,
  type AnkiDroidStatus,
  type AnkiDroidReceipt,
} from '../ankiDroid';

export function R3Anki({ initialCard }: { initialCard: Flashcard }) {
  const [endpoint, setEndpoint] = useState('');
  const [card, setCard] = useState(initialCard);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<AnkiDroidStatus | null>(null);
  const [receipt, setReceipt] = useState<AnkiDroidReceipt | null>(null);
  const [showDesktop, setShowDesktop] = useState(Platform.OS !== 'android');

  useEffect(() => {
    setCard(initialCard);
    setReceipt(null);
    setResult('');
  }, [initialCard]);
  useEffect(() => {
    getAnkiDroidStatus().then(setStatus, (error: unknown) => setResult(String(error)));
  }, []);

  const sendDirect = async () => {
    setSending(true);
    setResult('');
    setReceipt(null);
    try {
      const saved = await sendToAnkiDroid(card);
      setReceipt(saved);
      setResult(
        `PASS: note ${saved.noteId} ${saved.alreadyExists ? 'already exists' : 'saved'} in ${saved.deckName}. Fields and deck verified.`,
      );
    } catch (error) {
      setResult(`Not sent: ${(error as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    setSending(true);
    setResult('');
    try {
      const noteId = await sendCardToAnki(endpoint, card);
      setResult(`PASS: note ${noteId} added to the LingoLyrics PoC deck`);
    } catch (error) {
      setResult(`Not sent: ${(error as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>R3 Anki from a phone</Text>
      <Text>
        Selected in R2. Enter a translation and save it directly to AnkiDroid on this phone.
      </Text>
      <Text>
        {status?.available
          ? `Destination: ${status.label} · LingoLyrics PoC deck · no computer required`
          : 'Direct Android export requires AnkiDroid and the installed LingoLyrics APK.'}
      </Text>
      <TextInput
        onChangeText={(term) => setCard((current) => ({ ...current, term }))}
        placeholder="Term"
        style={styles.input}
        value={card.term}
      />
      <TextInput
        onChangeText={(translation) => setCard((current) => ({ ...current, translation }))}
        placeholder="Translation (required)"
        style={styles.input}
        value={card.translation}
      />
      <TextInput
        multiline
        onChangeText={(context) => setCard((current) => ({ ...current, context }))}
        placeholder="Context sentence"
        style={styles.input}
        value={card.context}
      />
      <Button
        title={sending ? 'Sending…' : 'Save to AnkiDroid'}
        disabled={sending || !status?.available}
        onPress={sendDirect}
      />
      {receipt ? (
        <Button
          title="Open AnkiDroid"
          onPress={() => {
            openAnkiDroid(receipt.packageName).catch((error: unknown) => setResult(String(error)));
          }}
        />
      ) : null}
      {result ? (
        <Text style={result.startsWith('PASS') ? styles.good : styles.bad}>{result}</Text>
      ) : null}
      <Button
        title={showDesktop ? 'Hide desktop option' : 'Desktop AnkiConnect option'}
        onPress={() => setShowDesktop(!showDesktop)}
      />
      {showDesktop ? (
        <>
          <Text>Optional: send to desktop Anki over Wi-Fi or USB forwarding.</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setEndpoint}
            placeholder="http://computer-ip:8765"
            style={styles.input}
            value={endpoint}
          />
          <Button title="Send to desktop Anki" disabled={sending} onPress={send} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '600' },
  input: { borderColor: '#999', borderWidth: 1, borderRadius: 4, padding: 10 },
  good: { color: '#070' },
  bad: { color: '#a00' },
});

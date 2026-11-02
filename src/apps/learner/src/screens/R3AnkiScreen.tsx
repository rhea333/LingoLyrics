import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { cardAsTsv, sendCardToAnki, type CardDraft } from '../core/anki';

interface Props {
  card: CardDraft;
  onChange(card: CardDraft): void;
}

export function R3AnkiScreen({ card, onChange }: Props) {
  const [endpoint, setEndpoint] = useState('');
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);

  function update(field: keyof CardDraft, value: string) {
    onChange({ ...card, [field]: value });
  }

  async function send() {
    setWorking(true);
    setStatus('');
    try {
      const noteId = await sendCardToAnki(endpoint, card);
      setStatus(`PASS · note ${noteId} is in the LingoLyrics PoC deck`);
    } catch (error) {
      setStatus(`Direct send failed: ${(error as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  async function shareFallback() {
    const file = new File(Paths.cache, 'lingolyrics-anki.tsv');
    file.create({ overwrite: true });
    file.write(cardAsTsv(card));
    await shareAsync(file.uri, { mimeType: 'text/tab-separated-values', dialogTitle: 'Export for Anki' });
    setStatus('Fallback created · import the TSV into Anki to complete the test');
  }

  return (
    <View style={styles.page}>
      <Text style={styles.heading}>R3 · send a word to Anki</Text>
      <Text>
        Direct method: the phone calls AnkiConnect on a desktop on the same network. TSV export is the documented fallback.
      </Text>
      <TextInput style={styles.input} value={card.term} onChangeText={(value) => update('term', value)} placeholder="Term" />
      <TextInput style={styles.input} value={card.reading} onChangeText={(value) => update('reading', value)} placeholder="Reading" />
      <TextInput style={styles.input} value={card.translation} onChangeText={(value) => update('translation', value)} placeholder="Translation" />
      <TextInput style={styles.input} value={card.context} onChangeText={(value) => update('context', value)} placeholder="Context sentence" />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
        value={endpoint}
        onChangeText={setEndpoint}
        placeholder="http://DESKTOP-LAN-IP:8765"
      />
      <Button title={working ? 'Sending…' : 'Send with AnkiConnect'} onPress={send} disabled={working} />
      <Button title="Share TSV fallback" onPress={shareFallback} />
      {status ? <Text style={status.startsWith('PASS') ? styles.pass : styles.status}>{status}</Text> : null}
      <Text style={styles.note}>
        Desktop setup: install AnkiConnect, bind it to the LAN for this controlled test, and allow the connection through the firewall. Restore local-only binding after the demo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 9 },
  heading: { fontSize: 19, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#999', padding: 9 },
  pass: { color: '#087830', fontWeight: '700' },
  status: { color: '#885d00' },
  note: { marginTop: 4, color: '#555', fontSize: 12 },
});

import type { Flashcard } from '@lingolyrics/anki';
import { NativeModules, PermissionsAndroid, Platform, type Permission } from 'react-native';

export interface AnkiDroidStatus {
  available: boolean;
  packageName?: string;
  permission?: string;
  label?: string;
  granted?: boolean;
}

export interface AnkiDroidReceipt {
  noteId: string;
  deckName: string;
  packageName: string;
  alreadyExists: boolean;
  verified: boolean;
}

interface AnkiDroidBridge {
  getStatus(): Promise<AnkiDroidStatus>;
  addNote(
    packageName: string,
    term: string,
    translation: string,
    context: string,
  ): Promise<AnkiDroidReceipt>;
  openApp(packageName: string): Promise<void>;
}

const bridge = NativeModules.LingoLyricsAnkiDroid as AnkiDroidBridge | undefined;

export async function getAnkiDroidStatus(): Promise<AnkiDroidStatus> {
  if (Platform.OS !== 'android' || !bridge) return { available: false };
  return bridge.getStatus();
}

export async function sendToAnkiDroid(card: Flashcard): Promise<AnkiDroidReceipt> {
  if (!card.term.trim() || !card.translation.trim() || !card.context.trim()) {
    throw new Error('Term, translation, and context are required');
  }
  if (!bridge) throw new Error('Use the installed Android APK for direct AnkiDroid access');
  const status = await getAnkiDroidStatus();
  if (!status.available || !status.packageName || !status.permission) {
    throw new Error('Install AnkiDroid and finish its setup, then try again');
  }
  if (!status.granted) {
    const permission = await PermissionsAndroid.request(status.permission as Permission);
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error(
        'AnkiDroid permission was not granted. Allow AnkiDroid access for LingoLyrics in Android app settings',
      );
    }
  }
  const receipt = await bridge.addNote(
    status.packageName,
    card.term,
    card.translation,
    card.context,
  );
  console.log(`R3_ANKIDROID_RESULT ${JSON.stringify(receipt)}`);
  return receipt;
}

export async function openAnkiDroid(packageName: string): Promise<void> {
  if (!bridge) throw new Error('AnkiDroid integration is unavailable in this build');
  return bridge.openApp(packageName);
}

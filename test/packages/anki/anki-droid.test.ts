import { NativeModules, PermissionsAndroid } from 'react-native';
import { sendToAnkiDroid } from '../../../src/apps/learner/src/ankiDroid';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  NativeModules: {
    LingoLyricsAnkiDroid: {
      getStatus: jest.fn(),
      addNote: jest.fn(),
      openApp: jest.fn(),
    },
  },
  PermissionsAndroid: { request: jest.fn(), RESULTS: { GRANTED: 'granted' } },
}));

const native = NativeModules.LingoLyricsAnkiDroid;
const card = {
  term: '雨',
  translation: 'rain',
  context: '今日は雨が降っている',
};
const status = {
  available: true,
  packageName: 'com.ichi2.anki.a',
  permission: 'com.ichi2.anki.permission.READ_WRITE_DATABASE',
  granted: false,
};
const receipt = {
  noteId: '123',
  deckName: 'LingoLyrics PoC',
  packageName: status.packageName,
  verified: true,
  alreadyExists: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  native.getStatus.mockResolvedValue(status);
  native.addNote.mockResolvedValue(receipt);
  jest.mocked(PermissionsAndroid.request).mockResolvedValue('granted');
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

test('requests the API permission while preserving the parallel target and all fields', async () => {
  await expect(sendToAnkiDroid(card)).resolves.toEqual(receipt);
  expect(PermissionsAndroid.request).toHaveBeenCalledWith(status.permission);
  expect(native.addNote).toHaveBeenCalledWith(
    status.packageName,
    card.term,
    card.translation,
    card.context,
  );
});

test('does not write a note when permission is denied', async () => {
  jest.mocked(PermissionsAndroid.request).mockResolvedValue('denied');
  await expect(sendToAnkiDroid(card)).rejects.toThrow('permission was not granted');
  expect(native.addNote).not.toHaveBeenCalled();
});

test('does not ask again when permission is already granted', async () => {
  native.getStatus.mockResolvedValue({ ...status, granted: true });
  await sendToAnkiDroid(card);
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(native.addNote).toHaveBeenCalledTimes(1);
});

test('reports missing AnkiDroid without attempting a write', async () => {
  native.getStatus.mockResolvedValue({ available: false });
  await expect(sendToAnkiDroid(card)).rejects.toThrow('Install AnkiDroid');
  expect(native.addNote).not.toHaveBeenCalled();
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
});

test('rejects incomplete cards before requesting access', async () => {
  await expect(sendToAnkiDroid({ ...card, translation: ' ' })).rejects.toThrow('required');
  expect(native.getStatus).not.toHaveBeenCalled();
  expect(native.addNote).not.toHaveBeenCalled();
});

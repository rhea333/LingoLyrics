# Learner app (PoC only)

The Expo app for the PoC demo has one screen for each development-plan risk:

- R1 measures lyric highlighting against mapped timestamps.
- R2 segments 20 Japanese lines into selectable words with romanization.
- R3 sends a selected word, translation, and context to AnkiConnect.

This is deliberately disposable PoC code. Logic lives in `packages/`; the app
only connects it to the phone UI, audio, and network.

Runs in **Expo Go** (SDK 58), so no development build or Mac is needed.

## Run on the iPhone

1. Install **Expo Go** from the App Store. It must support SDK 58.
2. Put the laptop and the phone on the same Wi-Fi.
3. From `src/`:
   ```sh
   npm install
   cd apps/learner
   npm start          # generates the test audio, then starts Metro
   ```
4. Scan the QR code with the iPhone camera.

The home screen shows whether the bundled song map passed validation. That
also confirms Ajv works under Hermes. If it doesn't, the screen shows the error
instead.

## R1: lyric sync

1. Turn the volume up. Use wired headphones or the speaker, since Bluetooth
   adds output latency R1 can't see.
2. Tap **Play from start** and let all 20 lines play through without pausing
   or seeking.
3. Tap **Share log** and AirDrop or save the JSON to the laptop. The log is
   also printed to the Metro console as `R1_TIMING_LOG {...}`.
4. Score it from `src/`: `npm run poc:r1 -- path/to/r1-log-....json`

For output latency, film the phone while it plays: each line start has a click,
so the click and the highlight should land in the same frame (±0.5 s).

## R2: lesson ready

Open **R2 lesson**. The screen times how long it takes, from opening to words
on screen, and shows:

- **ready**: the total time, including asset access and dictionary loading.
  This is the number compared against 3 s.
- a breakdown: assets, dictionary dictionary build, segmentation.

Go back and open it again for the **warm** time, when the dictionary is
already loaded. Each run is also printed to the Metro console as
`R2_LESSON_READY {...}`.

Tap a word to see its reading, romaji and dictionary form.

The checked segmentation file is `fixtures/gold/ja-20-lines.json`. It is still
marked `draft`; the R2 accuracy result is not final until the team checks it and
updates the review fields described in `fixtures/gold/GUIDELINE.md`.

## R3: save directly to AnkiDroid on Android

Install AnkiDroid and complete its first-run setup. The test Pixel uses the
official **AnkiDroid 2.25.3 arm64-v8a APK** from its GitHub release. This full
build supports the storage workaround needed on this Android 16 device; the
Play build could not initialize its external-files directory.

Use the standard **AnkiDroid** app for this demo. AnkiDroid.A is left installed
but must stay closed because both full builds can use the same collection.
The 2.25.3 parallel API has mismatched permission/URI constants. The bridge
checks provider support and skips incompatible API addresses instead of
reporting them as available.

1. Open R2, tap a word, then tap **Use this word in R3**.
2. Enter its translation. The selected term and lyric context are retained.
3. Tap **Save to AnkiDroid** and allow the AnkiDroid database permission when
   Android asks. Denial leaves the note unsent and shows an explanation.
4. The app creates a **LingoLyrics PoC** deck and a **LingoLyrics Vocabulary**
   note type with **Term**, **Translation**, and **Context** fields. It reads
   back the note and checks the card's deck before reporting success.
5. Tap **Open AnkiDroid** and inspect/review the card in that deck.

No desktop, USB connection, server, network, or AnkiWeb account is needed for
this path. An exact repeat of the same card reuses its existing note ID.

The native implementation lives in `native/ankidroid/`. The Expo config plugin
copies and registers it during prebuild and declares package visibility and
AnkiDroid permissions. `src/ankiDroid.ts` handles the React Native calls and
runtime permission request. This integration requires the installed APK; it
cannot run inside Expo Go.

### Optional desktop AnkiConnect path

R3's **Desktop AnkiConnect option** retains the earlier desktop test. Keep Anki
with AnkiConnect open, enter its reachable HTTP address, then tap **Send to
desktop Anki**. This separate path requires a local network or USB forwarding;
it does not insert into AnkiDroid.

## How kuromoji runs here

Kuromoji's own loader wants XHR and real file names. The preparation script
decompresses its dictionary into generated `.dat` assets on the build machine.
`src/kuromoji-rn.ts` reads those bundled files through expo-file-system and
passes their ArrayBuffers to kuromoji's `DictionaryLoader`. This avoids slow
JavaScript decompression on the phone. Metro includes `dat` assets and polyfills
Node's `path` module. `npm start` and `npm run android:apk` prepare the dictionary
automatically; the generated files are ignored by Git.

## Standalone Android APK

With Node/npm, JDK 17, Android SDK platform 37.0, build-tools 37.0.0,
NDK 27.1.12297006, and CMake 3.22.1 installed, run from this app folder:

```sh
npm run android:apk
```

The script generates the timing WAV and native Android project, builds only
`arm64-v8a` (including the Pixel 7 Pro), and copies the standalone APK to
`../../dist/android/lingolyrics-poc.apk`. The audio, JavaScript, and dictionary
assets are bundled; Metro and Expo Go are not required to run this APK.
The generated development signing key is for the PoC, not a store release.
The native project and APK outputs are ignored by Git.

Install on a USB-debugging-authorized phone:

```sh
"${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb" install -r ../../dist/android/lingolyrics-poc.apk
```

The app permits HTTP for the controlled AnkiConnect test. With desktop Anki
running locally, USB testing can use `adb reverse tcp:8765 tcp:8765` and
`http://127.0.0.1:8765` in R3; this is a USB transport test. For the documented
Wi-Fi demo, use the computer's reachable LAN address instead.

On the configured Mac, AnkiConnect uses port **8766** because another local
service already occupies 8765. Use `adb reverse tcp:8766 tcp:8766` and
`http://127.0.0.1:8766` for USB testing. Anki must remain open.

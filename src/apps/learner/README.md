# Learner app (PoC only)

The Expo app for the PoC demo, with one screen per risk. It's here to measure
R1 and R2 (and R3 in phase 5) on a real iPhone, and may be thrown away after
the PoC. All logic lives in `packages/`. This app only connects that logic to
the screen, audio and files.

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

- **ready**: the total time.
- **without asset download**: the total minus the time Expo Go spends
  downloading the dictionary from Metro. A real build ships the files inside
  the app, so this is the number to compare against 3 s.
- a breakdown: assets, dictionary build (including gunzip), segmentation.

Go back and open it again for the **warm** time, when the dictionary is
already loaded. Each run is also printed to the Metro console as
`R2_LESSON_READY {...}`.

Tap a word to see its reading, romaji and dictionary form.

## How kuromoji runs here

Kuromoji's own loader wants XHR and real file names. Expo assets get hashed
names, so `src/kuromoji-rn.ts` reads the bundled `.dat.gz` files with
expo-file-system and passes the bytes to kuromoji's `DictionaryLoader`. The
Metro config adds `gz` as an asset type and polyfills Node's `path` module.

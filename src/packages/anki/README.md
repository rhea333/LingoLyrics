# Anki package (R3)

This package contains the smallest useful R3 integration: `sendCardToAnki`.
It creates the **LingoLyrics PoC** deck if needed and adds one Basic note using
AnkiConnect API version 6.

The function accepts an HTTP client so the exact requests and error paths can
be tested without running Anki. Phone-specific form state stays in
`apps/learner/src/screens/R3Anki.tsx`.

This PoC deliberately tests one candidate from the Development Plan. It does
not add production configuration storage, AnkiDroid support, background sync,
or an export-file fallback.

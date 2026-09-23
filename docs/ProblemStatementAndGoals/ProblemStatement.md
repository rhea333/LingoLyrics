# Problem Statement and Goals: LingoLyrics

## Problem

Learning a language through songs currently takes a lot of separate steps.

Learners often need to find lyrics, translations, and romanization from different sources.

It can be difficult to understand individual words or phrases in context.

Existing music and lyric platforms are not designed around language learning.

Learners cannot always go at their own pace or easily repeat specific parts.

Saving useful vocabulary into tools like Anki can also take extra work.

The goal is to make learning through music more convenient and less fragmented.

Songs can make language learning more enjoyable, but the current process has too much friction.

## Inputs

A user may provide only a song/audio file.

Users may also provide:

- lyrics
- translations
- romanization or transliteration
- other language notes

Users may connect the Anki account or deck they want to use.

Existing song maps may also be downloaded and opened in the app.

## Outputs

- A desktop or mobile lesson player.
- Synchronized lyrics during song playback.
- Ability to pause and repeat specific lines.
- Ability to view translations.
- Ability to view romanization or transliteration where needed.
- Individual word meanings and contextual explanations.
- Ability to save useful words, kanji, phrases, or other language content.
- Ability to send selected vocabulary and context to Anki.

## Stakeholders

- Language learners.
- The Capstone development team.
- The supervising professor.
- Copyright holders for songs and lyrics.
- People who create and maintain song maps.

## Environment

- Mobile support for iPhone and Android.
- Desktop support for Windows and macOS.
- A separate website can be used to find and download song maps.
- The general model is similar to how osu! distributes community-created maps.
- Internet access is needed for downloading maps and online integrations.
- Downloaded maps can then be used by the main application.

## Goals

### Synchronized lesson playback

- Play a mapped audio track.
- Display the correct lyric line at the correct time.

### In-context vocabulary support

- Allow users to select a word or line.
- Show its translation.
- Show contextual explanations when available.

### Reusable song-map representation

- Create one portable map format.
- Store timing information.
- Store lyrics and translations.
- Store transliterations or romanization.
- Store word and line annotations.
- Store language metadata.
- Make the format readable by both the map editor and lesson application.

### Creator workflow

- Allow creators to load an audio track.
- Allow creators to set lyric timing.
- Allow timing for lines and words where needed.
- Allow creators to add translations and other annotations.
- Export a map that can be used by the learner application.

### Language-aware support

- Demonstrate support for at least two languages.
- The languages should have meaningfully different text-handling requirements.
- At least one should require language-specific segmentation, transliteration, romanization, or non-Latin text rendering.

### Anki handoff

- Let users select vocabulary from a song.
- Include the selected context.
- Send it to an Anki deck without requiring the user to retype it.

## Custom documents (provisional; instructor approval required)

- **Fall:** Design Thinking Report or User/Stakeholder/Client Interview Report, to validate learner and creator workflows.
- **Winter:** User Manual or Usability Report, to document and evaluate the editor and mobile lesson flows.

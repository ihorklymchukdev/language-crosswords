# Language Crosswords v1: offline app design

Date: 2026-11-11
Source material: `../language-crosswords-resources/docs/` (requirements, 9 feature briefs, 12 ADRs).
This document narrows that material to a v1 that can be built in one day and submitted to the App Store
and Google Play. Anything not covered here follows the briefs.

## Intent

A Spanish vocabulary app built around mini crosswords. Clues and answers are both in Spanish. The learner
can translate a clue to English or reveal a letter when stuck. The point of difference from linguno.com is
a first-class mobile experience. Target user: an adult A2–B2 learner with 5–15 spare minutes.

Owner constraint: almost no time. The goal is a store-ready build today, then iterate.

## Decisions made with the owner (2026-11-11)

1. **No server in v1.** The generator and word catalogue ship inside the app. No accounts, no sync, no
   telemetry backend. Progress is stored on the device only. This replaces ADR-0002 to ADR-0010 and
   ADR-0012 for v1; they stay valid as the direction for v1.1+ (accounts and sync).
2. **Claude authors the word catalogue**: Spanish headword, Spanish clue, English translation of the
   headword and of the clue, CEFR level, part of speech, themes, and region tag. It is original content,
   so there are no licence or attribution issues. Every entry is `auto-only`.
3. **Web ships too**, as an Expo static web export on GitHub Pages. The same site hosts the privacy policy
   the stores require.
4. **Accounts the owner holds:** Apple Developer. The owner still needs to create an Expo account (free,
   used for cloud builds) and a Google Play Console account ($25).
5. **This repo becomes public** so GitHub Pages is free: `https://ihorklymchukdev.github.io/language-crosswords/`
   (Expo Router base path `/language-crosswords`). Privacy URL `…/privacy`, support URL `…/support`.
6. **Claude may squash-merge its own PRs** once the code-review agent's findings are fixed.
7. **Public contact email** (privacy policy, support page, store listings) is the owner's git email.

## Goals

- Fully playable daily puzzle (A2/B1/B2), unlimited themed practice, letter reveal, clue translation,
  instant green feedback, completion screen, pause/resume, streak, and "missed" access to the last 3 dailies.
- iOS, Android, and web from one Expo codebase.
- Works with no network at all, including first launch.
- Passes App Store and Play Store review on the first attempt: privacy policy URL, "Data Not Collected"
  privacy labels, age rating 4+/Everyone, icon, splash screen, screenshots, listing copy.

## Non-goals (v1)

Accounts, sign-in, cross-device sync, GDPR export/delete (no personal data is held), any backend, analytics
SDKs, push notifications, ads/IAP, a reviewer admin tool, languages other than Spanish, a UI in any language
other than English, accessibility beyond platform defaults, tablet-specific layouts.

## Anti-goals

- Store rejection over something avoidable (missing privacy URL, a broken flow on a reviewer's device,
  placeholder content, crashes on first launch).
- Grids that feel broken: disconnected word islands, letter conflicts at crossings, clues that give away
  the answer.
- Punishing the learner: no "wrong" markers, no score deductions shown.

## Constraints carried over from the briefs

- Spanish diacritics (ñ á é í ó ú ü) enterable on every platform without long-press.
- Correct word turns green within 200 ms. Green cells become read-only. No "check answers" button.
- Daily: the same puzzle for everyone at a given (local date, level). It must not change once a learner
  has seen it.
- Daily anti-repeat: no word reused from the previous 7 days' dailies at the same level.
- No "current level" stored anywhere. Level chips are chosen per puzzle.
- Streak: +1 for the first daily completed on a local date at any level. Missing a date resets it.
  Completing a "missed" daily counts toward totals, not the streak.
- Daily grid ≤ 7×7, practice grid ≤ 9×9, 5–15 words.
- Data model keeps a `language` field so adding a second target language means more data, not rework.
- The layout must not hard-code left-to-right in a way that blocks a future right-to-left language.

## How it's built

### Stack (my call; consistent with ADR-0001)

Expo (latest stable SDK), React Native + React Native Web, Expo Router, TypeScript strict,
`StyleSheet.create`, AsyncStorage for persistence. No TanStack Query (nothing to fetch). EAS Build and
EAS Submit for the store binaries. Jest for unit tests. Repo: this one (`ihorklymchukdev/language-crosswords`).

### Word catalogue

- JSON files per level under `data/catalogue/es/{A2,B1,B2}.json`, plus `data/themes.json`.
- Entry: `id` (stable, never reused), `language: "es"`, `word` (display form with accents, lowercase,
  single word, letters from the Spanish alphabet only), `pos`, `level`, `region` (`neutral` | `es-ES` |
  `es-MX` | `es-419`), `themes[]`, `clue` (Spanish, 3–140 chars, with regional marker when non-neutral),
  `clueEn`, `translationEn`, `status: "auto-only" | "human-reviewed" | "do-not-use"`.
- Size target for v1: about 400 entries per level (≈1,200 total), covering about 20 themes. This is below
  the brief's 600/1,200/1,500 target. It grows later without code changes.
- A validation script runs in CI and before every data change. It enforces: unique ids; each word in exactly
  one level; clue does not contain the answer or an obvious inflection of it; length limits; allowed
  characters; 3+ letters (2-letter answers excluded in v1 to keep grids meaningful); profanity blocklist.
- Authored by Claude subagents in parallel, split by level × theme, then validated and de-duplicated.

### Generator (TypeScript, runs in the app and in build scripts)

- Freeform placement, not fixed templates. The catalogue is too small to fill dense templates, so ADR-0011's
  template + CSP approach is deferred. Words are placed one at a time and each new word must cross an
  existing word. Crossings must match on the exact character, accents included.
- Seeded PRNG. The same seed and catalogue give the same output.
- Several attempts per request. The best-scoring candidate wins (more crossings, more compact, better fill
  ratio). A quality gate rejects: any disconnected word, any letter conflict, side-by-side adjacency that
  forms unintended words, fewer than 5 words, a size over the limit.
- Theme filter and an exclude list (anti-repeat). Rejections are structured (`pool-exhausted`,
  `theme-too-narrow`, `quality-gate-failed`).
- At most one entry per spelling per puzzle (homograph rule).
- The interlock floor ("60% of cells are crossings") is **dropped**. Freeform mini crosswords can't reach it.
  The rule becomes "every word crosses at least one other, and the grid is one connected piece".

### Daily puzzles

- A build-time script pre-generates a **daily schedule** in `data/daily/es/{level}.json`, about 400 days
  ahead from 2026-11-01. Each day stores the placed words compactly: entry id, row, col, direction.
  Clue text is resolved from the catalogue at runtime, so typo fixes in clues show up. Entries the schedule
  references are never deleted. Banning one marks it `do-not-use`, and the script regenerates future dates
  only.
- The schedule is **fully append-only**: existing dates are never regenerated. That keeps every user on
  every app version seeing the same daily. A word banned later stays in dailies already published (matching
  the brief's "retracted word stays in the published instance"). Later releases only append new dates.
  Review: `npm run daily:preview -- --days 14` prints the upcoming dailies in readable form (my call).
- The 7-day anti-repeat is enforced by the script while generating the schedule.
- If a date falls past the schedule's end (the user hasn't updated in over a year), the app generates the
  daily on the device from a seed of `(date, level)` and the catalogue.
- If no daily exists for a (date, level), that chip is hidden for the day (per the brief).

### Practice

- Level chips, then a theme list (themes with enough words at that level), plus "Any theme". Generated on
  the device instantly.
- Anti-repeat: word ids from the last 10 practice puzzles at that level are excluded. The exclusion is
  relaxed automatically if the pool runs dry.
- Completion screen shows "Next" (same level and theme).

### Play surface

- Grid plus the active clue bar above an **in-app keyboard**: QWERTY, a Spanish row (ñ á é í ó ú ü),
  backspace, and buttons for reveal letter, translate clue, and switch direction. The OS keyboard is not
  used, so behaviour is identical everywhere. On web, a physical keyboard also works (letters, arrows,
  backspace, Tab for the next clue).
- **Accent matching (my call):** typing a plain vowel in a cell whose answer is accented counts as correct.
  When the word turns green, the cell shows the correct accented letter. `ñ` is a distinct letter from `n`.
  This keeps completion high and still teaches the spelling.
- Tap a cell to select it. Tap it again to switch direction. Typing advances the cursor and skips green
  cells. Backspace clears the cell or steps back.
- A cell turns green when every word it belongs to is fully correct. Revealed letters are shown in a
  distinct colour and count as correct.
- Clue list below the grid (scrollable). Translated clues stay translated for that puzzle.
- Timer pauses when the app is backgrounded. State is saved on every change and restored exactly.
- Completion: time, letters revealed, clues translated. Back to home, or Next in practice. Reopening a
  completed daily shows it solved, with "Play again", which resets it locally and doesn't affect the streak.

### Navigation

Tabs: **Today** (streak, A2/B1/B2 cards with status, "Missed" for the last 3 days), **Practice**, **About**
(how to play, privacy policy link, version, credits). Puzzle route: `puzzle/[kind]/[id]`. Dark mode follows
the OS.

### Persistence

AsyncStorage, one versioned key per concern (progress per puzzle, daily completions log, practice history,
streak derived from the completions log). A schema version number and a migration function exist from day one.

### Web

`expo export --platform web` with a GitHub Pages base path, deployed by GitHub Actions on pushes to `main`.
`/privacy` is a route in the app, so the privacy policy URL is the web build's `/privacy` page.

### Release

- App name: placeholder "Crossword Spanish" until the owner picks a brand name (one config value +
  listings). Bundle ID / package: `com.ihorklymchuk.crosswords`, neutral so any name fits; permanent after
  the first store upload.
- Version 1.0.0. EAS profiles: `development`, `preview` (internal APK), `production` (store). EAS Update
  isn't configured in v1.
- Claude produces: app icon and splash (generated artwork), store listing copy, privacy policy text, privacy
  label answers, and screenshots captured from the web build at phone resolutions.
- The owner does: create the Expo and Play Console accounts, run `eas login`, approve the builds, fill in the
  store forms (using the prepared copy), and press Submit. Play publishes only after the 14-day closed test
  if the Play account is a new personal account.

### Testing (per the owner's testing rules)

Unit tests only where a wrong result is plausible: generator invariants (determinism, connectivity, no
letter conflicts, size limits, exclude list honoured); input matching (accents, ñ); green-cell rule; streak
math across date gaps; catalogue validator. No screen snapshots.

### Git

Initial commit on `main` (scaffold + this doc). Then a GitHub issue and a `feature/<n>-<slug>` branch per
chunk of work, a PR to `main` for each, and a code-review agent run after every PR.

## Definition of done for today (my call)

iOS build submitted for App Store review, web live, Android production build (AAB) ready to upload for a
closed test. If time runs short, cut in this order: catalogue size (to about 250 per level), then the
"Missed" dailies, then the web physical-keyboard extras. The App Store needs a Support URL too, so the web
build also gets a `/support` page.

## Left to the builder

File layout inside `src/`, scoring weights in the generator, the colour palette and typography (clean and
calm, with high contrast in both light and dark mode), the exact theme list, how many generator attempts to
run, and how to split the PRs.

## Known v1 gaps (accepted)

- Success metrics (D7 retention, completion rate) can't be measured without analytics. App Store Connect
  and Play Console give basic retention only.
- Words are not human-reviewed. CEFR levels are Claude's judgement.
- Progress is lost on reinstall or a device change (no accounts until v1.1).

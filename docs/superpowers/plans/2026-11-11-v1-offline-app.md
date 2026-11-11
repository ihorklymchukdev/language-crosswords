# Language Crosswords v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An offline Spanish mini-crossword app (daily + practice) for iOS, Android and web, ready for store submission today.

**Architecture:** Expo app with no backend. A bundled JSON word catalogue feeds a TypeScript freeform crossword generator. The generator runs at build time (daily schedule) and on the device (practice, plus the fallback after the schedule ends). Play state and progress live in AsyncStorage.

**Tech Stack:** Expo SDK 58, Expo Router, React Native 0.88, TypeScript strict, AsyncStorage, Jest (`jest-expo`), `tsx` for scripts, EAS Build/Submit, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-11-11-v1-offline-app-design.md`

## Global Constraints

- Levels: `['A2','B1','B2'] as const`, never hard-coded elsewhere as "three".
- Spanish alphabet for answers: `a-z`, `ñ`, `á é í ó ú ü`. Lowercase. Single word. Length ≥ 3.
- Clue 3–140 chars, must not contain the answer (accent-insensitive substring check on the stem: the answer minus its last 2 letters, when the answer is ≥ 5 letters).
- Daily grid ≤ 7×7; practice grid ≤ 9×9; 5–15 words per puzzle.
- Daily anti-repeat: 7 days, same level. Practice anti-repeat: word ids from the last 10 practice puzzles at that level.
- Missed dailies: the previous 3 local dates.
- Green within 200 ms; green cells read-only; no "wrong" indication.
- Accent matching: base vowel matches accented vowel; `ñ` ≠ `n`; `ü` matches `u`.
- No "current level" persisted anywhere.
- Bundle ID / Android package: `com.ihorklymchuk.crosswords`. Display name: `Crossword Spanish` (placeholder, one constant in `app.config.ts`).
- Web base path: `/language-crosswords`. Privacy: `https://ihorklymchukdev.github.io/language-crosswords/privacy`. Support: `…/support`.
- Contact email: the owner's git `user.email`.
- RN primitives + `StyleSheet.create` only. Named exports. No `any`. No `enum`.
- Git: issue per PR, branch `feature/<issue>-<slug>`, PR to `main`, code-review agent after each PR, squash-merge after fixes.

## Review Focus

1. Generator can't fill a request (small theme pool, heavy exclude list): must return a structured rejection quickly, never hang or throw. Test in Task 3: `returns pool-exhausted when fewer candidates than minWords` and `finishes under 500ms for any theme at any level`.
2. A word that crosses a word typed with plain vowels: the shared cell must still go green when both are right. Test in Task 4: `cell shared by two accented words turns green with unaccented input`.
3. Local date at midnight / DST / timezone: date keys must come from local calendar fields, never `toISOString()`. Test in Task 5: `localDateKey uses local fields` and `addDays crosses DST boundary`.
4. Upgrading the app with stored state from an older schema: loading must not crash and must keep progress. Test in Task 5: `loadState returns defaults on corrupt JSON` and `migrates v0 to current`.
5. Puzzle ids referenced in storage that no longer resolve (entry removed, schedule end): the screen shows "not available" instead of crashing. Test in Task 4: `resolvePuzzle returns undefined for unknown entry id`.

---

### Task 1: Scaffold + repo foundation (issue #1, PR 1 with Tasks 2–5)

**Files:**
- Create: Expo app at the repo root (`npx create-expo-app@5 . --template blank-typescript`, then add Expo Router per its docs), `app.config.ts`, `tsconfig.json` (strict, `noUncheckedIndexedAccess`), `jest.config.js` (preset `jest-expo`), `.gitignore`, `README.md`, `AGENTS.md` (points at the spec + engineering rules), `CLAUDE.md` → `@AGENTS.md`.
- Create: `src/domain/types.ts`, `src/domain/levels.ts`.

**Interfaces — Produces:**
```ts
export const LEVELS = ['A2', 'B1', 'B2'] as const;
export type Level = (typeof LEVELS)[number];
export type Region = 'neutral' | 'es-ES' | 'es-MX' | 'es-419';
export type EntryStatus = 'auto-only' | 'human-reviewed' | 'do-not-use';
export type Entry = { id: string; language: 'es'; word: string; pos: string; level: Level; region: Region;
  themes: string[]; clue: string; clueEn: string; translationEn: string; status: EntryStatus };
export type Theme = { id: string; nameEn: string; nameEs: string };
export type Direction = 'across' | 'down';
export type Placement = { entryId: string; row: number; col: number; direction: Direction };
export type PuzzleKind = 'daily' | 'practice';
export type PuzzleSpec = { id: string; kind: PuzzleKind; level: Level; rows: number; cols: number;
  placements: Placement[]; date?: string; themeId?: string };
```

- [ ] **Step 1:** Create GitHub issue "v1 foundation: scaffold, catalogue schema, generator, play logic, progress" → #1. Make an empty-ish initial commit on `main` with spec + plan, push. Branch `feature/1-v1-foundation`.
- [ ] **Step 2:** Scaffold; `app.config.ts` sets `name`, `slug: 'language-crosswords'`, `scheme: 'crosswords'`, `ios.bundleIdentifier`, `android.package`, `userInterfaceStyle: 'automatic'`, `experiments.baseUrl: '/language-crosswords'` only when `process.env.WEB_BASE === '1'`, `web.output: 'static'`.
- [ ] **Step 3:** Run `npx tsc --noEmit && npx jest --passWithNoTests && npx expo export --platform web`. Expected: all succeed.
- [ ] **Step 4:** Commit `chore: scaffold expo app with router and strict ts`.

### Task 2: Catalogue loader + validator

**Files:** Create `src/catalogue/catalogue.ts`, `scripts/validate-catalogue.ts`, `src/catalogue/validate.ts`, `src/catalogue/profanity.ts`, `data/themes.json`, `data/catalogue/es/{A2,B1,B2}.json` (5 seed entries each until Task 6), test `src/catalogue/validate.test.ts`.

**Interfaces — Produces:**
```ts
// catalogue.ts (static requires of the JSON files)
export function getEntries(level: Level): readonly Entry[];       // excludes do-not-use
export function getEntry(id: string): Entry | undefined;          // includes do-not-use (old dailies)
export function getThemes(): readonly Theme[];
export function themesForLevel(level: Level, minWords: number): readonly Theme[];
export const CATALOGUE_VERSION: string;                            // from data/catalogue/es/version.json
// validate.ts
export type ValidationIssue = { entryId: string; problem: string };
export function validateCatalogue(entries: Entry[], themes: Theme[]): ValidationIssue[];
export function normalizeBase(s: string): string;  // lowercase, strip á é í ó ú ü → base; keeps ñ
```

- [ ] **Step 1: Failing tests** in `validate.test.ts`: `flags duplicate ids`; `flags a word present in two levels`; `flags clue containing the answer ignoring accents` (word `canción`, clue `Una cancion bonita` → issue); `flags clue over 140 chars`; `flags answers with spaces, digits or 2 letters`; `flags unknown theme id`; `flags profanity`; `accepts a valid entry` (returns `[]`).
- [ ] **Step 2:** `npx jest src/catalogue` → FAIL.
- [ ] **Step 3:** Implement. Also `npm run catalogue:validate` (tsx script) that exits 1 and prints issues.
- [ ] **Step 4:** `npx jest src/catalogue` → PASS. Commit `feat: catalogue schema, loader and validator`.

### Task 3: Generator

**Files:** Create `src/generator/rng.ts`, `src/generator/generate.ts`, `src/generator/grid-check.ts`, test `src/generator/generate.test.ts`.

**Interfaces — Produces:**
```ts
export type Rng = () => number;                       // [0,1)
export function seededRng(seed: string): Rng;         // cyrb128 hash → sfc32
export type GenerateRequest = { candidates: readonly Entry[]; maxRows: number; maxCols: number;
  minWords: number; maxWords: number; exclude?: ReadonlySet<string>; rng: Rng; attempts?: number };
export type RejectReason = 'pool-exhausted' | 'theme-too-narrow' | 'quality-gate-failed';
export type GenerateResult = { ok: true; rows: number; cols: number; placements: Placement[]; score: number }
  | { ok: false; reason: RejectReason };
export function generateLayout(req: GenerateRequest): GenerateResult;
export function checkLayout(placements: Placement[], words: Map<string, string>, rows: number, cols: number): string[]; // problems
```

Algorithm (freeform): shuffle candidates with `rng`, prefer `human-reviewed`, drop excluded ids and duplicate spellings. Per attempt (default 40): seed with a 5–7 letter word in the middle of a working 2·max board; repeatedly pick the next candidate that can cross a placed word on an exact-equal char, where the new word does not touch any parallel neighbour cell and has a blank cell before and after it, and the bounding box stays ≤ max. Stop at `maxWords` or when nothing fits. Keep the attempt if ≥ `minWords`. Score = crossings×3 + words×2 − (rows·cols − filledCells)×0.3. Translate the best one to a 0-based top-left. Return `pool-exhausted` if usable candidates < `minWords`, else `quality-gate-failed` if no attempt qualifies.

- [ ] **Step 1: Failing tests** (property-style loops over 200 seeds against a 300-word fixture built from real Spanish words in the test): `is deterministic for the same seed`; `never conflicts at crossings and every word crosses another` (via `checkLayout` returning `[]`, which checks conflicts, connectivity, unintended adjacent letters, bounds); `respects maxRows/maxCols 7 and 9`; `never uses excluded ids`; `never uses the same spelling twice`; `returns pool-exhausted when fewer candidates than minWords`; `finishes under 500ms for 9x9 with 400 candidates`.
- [ ] **Step 2:** `npx jest src/generator` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS. Commit `feat: seeded freeform crossword generator`.

### Task 4: Puzzle model + play logic

**Files:** Create `src/play/matching.ts`, `src/play/puzzle.ts`, `src/play/play-state.ts`, tests `src/play/play-state.test.ts`, `src/play/matching.test.ts`.

**Interfaces — Produces:**
```ts
// matching.ts
export function lettersMatch(typed: string, answer: string): boolean;   // á~a, ü~u, ñ≠n
// puzzle.ts
export type Slot = { index: number; number: number; direction: Direction; entry: Entry; cells: number[] }; // cells = row*cols+col
export type Puzzle = { spec: PuzzleSpec; slots: Slot[]; solution: (string | null)[] };            // null = block
export function resolvePuzzle(spec: PuzzleSpec): Puzzle | undefined;    // undefined if any entryId unknown
// play-state.ts
export type PlayState = { puzzleId: string; letters: (string | null)[]; revealed: boolean[];
  translated: number[]; cursor: number; direction: Direction; elapsedMs: number; completedAt?: number };
export type PlayAction = { type: 'select'; cell: number } | { type: 'type'; letter: string }
  | { type: 'backspace' } | { type: 'reveal' } | { type: 'translate' } | { type: 'toggleDirection' }
  | { type: 'nextSlot'; delta: 1 | -1 } | { type: 'tick'; ms: number } | { type: 'reset' };
export function initialPlayState(p: Puzzle): PlayState;
export function playReducer(p: Puzzle, s: PlayState, a: PlayAction): PlayState;
export function greenCells(p: Puzzle, s: PlayState): boolean[];   // cell green iff every slot through it is correct
export function isComplete(p: Puzzle, s: PlayState): boolean;
export function activeSlot(p: Puzzle, s: PlayState): Slot | undefined;
```
Numbering: standard crossword numbering, reading order. Selecting the current cursor cell toggles direction if a slot exists in the other direction. Typing in a green cell moves on without changing it. `completedAt` is set once when `isComplete` first becomes true. `tick` is ignored once completed.

- [ ] **Step 1: Failing tests:** `lettersMatch('a','á') true, ('n','ñ') false, ('u','ü') true`; `typing advances along direction and skips green cells`; `backspace on empty cell steps back and clears`; `cell shared by two accented words turns green with unaccented input`; `cell is not green when only one of its two words is correct`; `green cells ignore typing`; `reveal fills the cursor cell and marks revealed`; `translate records active slot once`; `select same cell toggles direction only when the other direction exists`; `completedAt set when all correct, including fully revealed`; `resolvePuzzle returns undefined for unknown entry id`.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS. Commit `feat: puzzle model and play reducer`.

### Task 5: Dates, daily schedule, practice selection, progress storage

**Files:** Create `src/daily/dates.ts`, `src/daily/daily.ts`, `src/practice/practice.ts`, `src/progress/storage.ts`, `src/progress/streak.ts`, `src/progress/progress-context.tsx`, `scripts/build-daily-schedule.ts`, `scripts/daily-preview.ts`, `data/daily/es/{A2,B1,B2}.json`, tests `src/daily/daily.test.ts`, `src/progress/streak.test.ts`, `src/progress/storage.test.ts`.

**Interfaces — Produces:**
```ts
// dates.ts
export function localDateKey(d?: Date): string;          // 'YYYY-MM-DD' from local fields
export function addDays(key: string, n: number): string;
// daily.ts — schedule file shape: { version: 1, days: Record<dateKey, { rows, cols, placements }> }
export const DAILY_LIMITS = { maxRows: 7, maxCols: 7, minWords: 5, maxWords: 10 };
export function getDailySpec(date: string, level: Level): PuzzleSpec | undefined;  // schedule, else seeded fallback `daily:${date}:${level}:${CATALOGUE_VERSION}` with 7-day exclude
export function dailyPuzzleId(date: string, level: Level): string;   // `daily-${level}-${date}`
// practice.ts
export const PRACTICE_LIMITS = { maxRows: 9, maxCols: 9, minWords: 6, maxWords: 12 };
export function makePracticeSpec(level: Level, themeId: string | undefined, recentEntryIds: ReadonlySet<string>, seed: string): PuzzleSpec | { reason: RejectReason }; // retries without exclude on pool-exhausted
// storage.ts — single AsyncStorage key 'lc:state', JSON with schemaVersion
export type DailyCompletion = { date: string; level: Level; completedOn: string }; // completedOn = local date it was finished
export type StoredState = { schemaVersion: 1; plays: Record<string, PlayState & { spec: PuzzleSpec }>;
  dailyCompletions: DailyCompletion[]; practiceHistory: Record<Level, string[][]> };  // last 10 puzzles' entry ids
export function parseState(raw: string | null): StoredState;   // defaults on null/corrupt, migrates older versions
// streak.ts
export function currentStreak(completions: readonly DailyCompletion[], today: string): number;
```
Streak rule: count a date D as a streak day iff some completion has `date === D && completedOn === D` (missed dailies don't count). Streak = consecutive streak days ending today, or ending yesterday if today has none yet.

`scripts/build-daily-schedule.ts --from 2026-11-01 --days 400`: appends only dates missing from each file, in order, seed `daily:${date}:${level}`, excluding entry ids used in the previous 7 days of that level; candidates = entries of the level with status ≠ `do-not-use`. Never rewrites existing dates. `daily-preview.ts --days 14` prints date, level, the grid as text, and the clues.

- [ ] **Step 1: Failing tests:** `localDateKey uses local fields`; `addDays crosses DST boundary` (`TZ=Europe/Madrid`, 2027-03-27 +1 → 2027-03-28); `getDailySpec is identical across calls`; `fallback daily excludes previous 7 days' entries`; `streak counts consecutive days and ignores missed-daily completions`; `streak survives when today not yet played`; `streak resets after a gap`; `multiple levels same day count once`; `loadState returns defaults on corrupt JSON`; `migrates v0 to current` (v0 = no `schemaVersion`, only `plays`).
- [ ] **Step 2:** FAIL → **Step 3:** implement; run `npm run daily:build` and `npm run daily:preview` → readable output. → **Step 4:** PASS.
- [ ] **Step 5:** Commit, push, open PR 1 → run code-review agent → fix → squash-merge.

### Task 6: Word catalogue content (issue #2, PR 2)

**Files:** `data/themes.json` (final ~20 themes), `data/catalogue/es/{A2,B1,B2}.json`, `data/catalogue/es/version.json`, then regenerated `data/daily/es/*.json`.

- [ ] **Step 1:** Final theme list (ids kebab-case English): food, drinks, family, body, health, house, clothing, city, transport, travel, nature, animals, weather, time, work, school, emotions, sports, shopping, technology, common-verbs, common-adjectives.
- [ ] **Step 2:** Dispatch parallel authoring subagents (one per level × group of themes), each writing a JSON array file under `scratchpad/catalogue/` following the `Entry` schema and Global Constraints, ~400 entries per level overall, with id format `es-<level>-<word>` (+ `-2` for homographs). Brief them on CEFR placement, clue style (short Spanish definition, no answer, regional marker `(España)`/`(México)`/`(América Latina)` when not neutral, and the English equivalent in `clueEn`).
- [ ] **Step 3:** Merge, de-duplicate (a word goes to its lowest level), run `npm run catalogue:validate` → 0 issues (fix or drop offenders).
- [ ] **Step 4:** Delete the seed daily files and run `npm run daily:build -- --from 2026-11-01 --days 400`; check every date × level exists; `npm run daily:preview -- --days 7` and eyeball.
- [ ] **Step 5:** PR 2 → review agent → fix → merge.

### Task 7: Play screen UI (issue #3, PR 3 with Tasks 8)

**Files:** `src/ui/theme.ts` (light/dark palettes via `useColorScheme`), `src/ui/Grid.tsx`, `src/ui/Keyboard.tsx`, `src/ui/ClueBar.tsx`, `src/ui/ClueList.tsx`, `src/ui/CompletionCard.tsx`, `src/play/usePlay.ts` (reducer + persistence + timer with AppState pause + web `keydown` on `Platform.OS === 'web'`), `app/puzzle/daily/[level]/[date].tsx`, `app/puzzle/practice/[level].tsx` (query `theme`).

- Keyboard rows: `q w e r t y u i o p` / `a s d f g h j k l ñ` / `z x c v b n m ⌫` / `á é í ó ú ü`; action row: Reveal, Translate, ↔ direction.
- Grid sizes cells to fit `min(width - 32, 420) / cols`. Colours: active slot tint, cursor cell strong tint, green cells, revealed letters in a distinct colour.
- Completion card: time `m:ss`, letters revealed, clues translated; buttons "Done" (back) and, in practice, "Next puzzle". A completed daily reopened shows the solved grid and "Play again" (dispatch `reset`; completions log untouched).
- Daily completion appends `DailyCompletion` once per (date, level); practice completion pushes its entry ids to `practiceHistory[level]` (keep 10).

- [ ] **Step 1:** Build it; run `npx expo start --web` and play a full daily via the browser (Chrome tools): type, reveal, translate, completion, reload → state restored.
- [ ] **Step 2:** Commit `feat: crossword play screen`.

### Task 8: Home tabs, info pages

**Files:** `app/_layout.tsx` (ProgressProvider, Stack), `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx` (Today: streak, level cards with not started / in progress / done, Missed section for the 3 previous dates with incomplete dailies), `app/(tabs)/practice.tsx` (level chips, theme chips from `themesForLevel(level, 12)` + "Any theme", Play button; rejection message with a one-tap "Any theme"), `app/(tabs)/about.tsx` (how to play, links to privacy/support, version), `app/privacy.tsx`, `app/support.tsx` (static text; contact email; privacy states no data collected, all progress stored on device).

- [ ] **Step 1:** Build; verify in the browser on 390×844 and desktop widths, in light and dark.
- [ ] **Step 2:** `npx tsc --noEmit && npx jest` green. PR 3 → review agent → fix → merge.

### Task 9: Web deploy + release prep (issue #4, PR 4)

**Files:** `.github/workflows/ci.yml` (tsc, jest, catalogue:validate on PRs), `.github/workflows/pages.yml` (on push to main: `WEB_BASE=1 npx expo export --platform web`, copy `index.html` → `404.html`, add `.nojekyll`, deploy with `actions/deploy-pages`), `eas.json` (`development`, `preview` APK, `production` with `autoIncrement`), `assets/icon.png` 1024², `assets/adaptive-icon.png`, `assets/splash-icon.png`, `store/listing.md` (name, subtitle, description, keywords, promo text, privacy label answers, age rating answers, Play data-safety answers), `store/screenshots/` (iPhone 6.9" 1320×2868 and Android phone, captured from the web build).

- [ ] **Step 1:** Make the repo public (`gh repo edit --visibility public --accept-visibility-change-consequences`), enable Pages with GitHub Actions source; push; verify `…/language-crosswords/privacy` loads.
- [ ] **Step 2:** Icon: generate an SVG (grid tile with `ñ`), render PNGs with `sharp` from a scratch script.
- [ ] **Step 3:** `npx expo-doctor` clean; `npx expo export` for all platforms succeeds.
- [ ] **Step 4:** PR 4 → review agent → fix → merge.
- [ ] **Step 5 (needs owner):** `eas login`, `eas init`, `eas build -p ios --profile production`, `eas submit -p ios`; `eas build -p android --profile production` → upload AAB to Play closed testing.

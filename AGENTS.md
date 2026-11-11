# Language Crosswords

Offline Spanish mini-crossword app (Expo, iOS/Android/web, no backend).

- Spec: `docs/superpowers/specs/2026-11-11-v1-offline-app-design.md`
- Plan: `docs/superpowers/plans/2026-11-11-v1-offline-app.md`

## Commands

- `npm run web` / `npm run ios` / `npm run android`: run the app
- `npm run typecheck`: `tsc --noEmit`
- `npm test`: Jest (`jest-expo`)
- `npx expo export --platform web`: static web build (output in `dist/`, gitignored)

## Code rules

- React Native primitives and `StyleSheet.create` only.
- Named exports (default exports only where Expo Router requires them: files in `app/`).
- No `any`. No `enum` (use string unions / `as const`).
- Strict TypeScript, including `noUncheckedIndexedAccess`.
- Levels come from `LEVELS` in `src/domain/levels.ts`; never hard-code the set.
- Dates: use local calendar fields, never `toISOString()`.
- Git: one issue per PR, branch `feature/<issue>-<slug>`, PR to `main`.

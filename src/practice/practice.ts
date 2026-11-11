import { getEntries } from '../catalogue/catalogue';
import type { Level } from '../domain/levels';
import type { Entry, PuzzleSpec } from '../domain/types';
import { generateLayout, type RejectReason } from '../generator/generate';
import { seededRng } from '../generator/rng';

export const PRACTICE_LIMITS = { maxRows: 13, maxCols: 13, minWords: 20, maxWords: 30, attempts: 20 };
// Theme pools hold 12–60 words: too few to fill a 20-word grid, so themed puzzles stay mini.
export const THEMED_PRACTICE_LIMITS = { maxRows: 9, maxCols: 9, minWords: 6, maxWords: 12 };

// A big grid uses a large share of the level's words, so avoiding every recent puzzle can
// empty the pool; step down to the last few before allowing any repeat.
const RECENT_FALLBACK = 3;

export function makePracticeSpec(
  level: Level,
  themeId: string | undefined,
  recentPuzzles: readonly (readonly string[])[],
  seed: string,
  entries: readonly Entry[] = getEntries(level),
): PuzzleSpec | { reason: RejectReason } {
  const candidates = themeId === undefined ? entries : entries.filter((e) => e.themes.includes(themeId));
  const limits = themeId === undefined ? PRACTICE_LIMITS : THEMED_PRACTICE_LIMITS;
  if (candidates.length < limits.minWords) return { reason: 'theme-too-narrow' };

  const windows = [...new Set([recentPuzzles.length, Math.min(RECENT_FALLBACK, recentPuzzles.length), 0])];
  let result: ReturnType<typeof generateLayout> = { ok: false, reason: 'quality-gate-failed' };
  for (const n of windows) {
    const exclude = new Set(recentPuzzles.slice(recentPuzzles.length - n).flat());
    // The rng is stateful, so each attempt gets a fresh one to stay deterministic.
    result = generateLayout({ ...limits, candidates, exclude, rng: seededRng(seed) });
    if (result.ok) break;
  }
  if (!result.ok) return { reason: result.reason };

  return {
    id: `practice-${level}-${seed}`,
    kind: 'practice',
    level,
    rows: result.rows,
    cols: result.cols,
    placements: result.placements,
    ...(themeId !== undefined ? { themeId } : {}),
  };
}

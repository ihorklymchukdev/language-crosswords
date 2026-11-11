import { getEntries } from '../catalogue/catalogue';
import type { Level } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import { generateLayout, type RejectReason } from '../generator/generate';
import { seededRng } from '../generator/rng';

export const PRACTICE_LIMITS = { maxRows: 9, maxCols: 9, minWords: 6, maxWords: 12 };

export function makePracticeSpec(
  level: Level,
  themeId: string | undefined,
  recentEntryIds: ReadonlySet<string>,
  seed: string,
): PuzzleSpec | { reason: RejectReason } {
  const all = getEntries(level);
  const candidates = themeId === undefined ? all : all.filter((e) => e.themes.includes(themeId));
  if (candidates.length < PRACTICE_LIMITS.minWords) return { reason: 'theme-too-narrow' };

  // The rng is stateful, so each attempt gets a fresh one to stay deterministic.
  const run = (exclude: ReadonlySet<string> | undefined) =>
    generateLayout({ ...PRACTICE_LIMITS, candidates, exclude, rng: seededRng(seed) });
  let result = run(recentEntryIds);
  if (!result.ok && (result.reason === 'pool-exhausted' || result.reason === 'quality-gate-failed')) {
    result = run(undefined);
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

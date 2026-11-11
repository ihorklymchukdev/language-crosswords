import type { Level } from '../domain/levels';
import type { Entry, Placement } from '../domain/types';
import { generateLayout } from '../generator/generate';
import { seededRng } from '../generator/rng';

export const DAILY_LIMITS = { maxRows: 7, maxCols: 7, minWords: 5, maxWords: 10 };

export type DailyLayout = { rows: number; cols: number; placements: Placement[] };

// Kept free of JSON imports so the Node build script can share it.
export function generateDailyLayout(
  seed: string,
  candidates: readonly Entry[],
  exclude: ReadonlySet<string>,
): DailyLayout | undefined {
  const result = generateLayout({ ...DAILY_LIMITS, candidates, exclude, rng: seededRng(seed) });
  if (!result.ok) return undefined;
  return { rows: result.rows, cols: result.cols, placements: result.placements };
}

export function dailySeed(date: string, level: Level): string {
  return `daily:${date}:${level}`;
}

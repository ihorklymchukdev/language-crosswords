import { CATALOGUE_VERSION, getEntries } from '../catalogue/catalogue';
import type { Level } from '../domain/levels';
import type { Entry, PuzzleSpec } from '../domain/types';
import a2 from '../../data/daily/es/A2.json';
import b1 from '../../data/daily/es/B1.json';
import b2 from '../../data/daily/es/B2.json';
import { addDays } from './dates';
import { DAILY_LIMITS, dailySeed, generateDailyLayout, type DailyLayout } from './daily-layout';

export { DAILY_LIMITS };

export type DailySchedule = { version: 1; days: Record<string, DailyLayout> };

const SCHEDULES: Record<Level, DailySchedule> = {
  A2: a2 as DailySchedule,
  B1: b1 as DailySchedule,
  B2: b2 as DailySchedule,
};

const ANTI_REPEAT_DAYS = 7;

export function dailyPuzzleId(date: string, level: Level): string {
  return `daily-${level}-${date}`;
}

function toSpec(layout: DailyLayout, date: string, level: Level): PuzzleSpec {
  return {
    id: dailyPuzzleId(date, level),
    kind: 'daily',
    level,
    date,
    rows: layout.rows,
    cols: layout.cols,
    placements: layout.placements,
  };
}

export function dailySpecFrom(
  schedule: DailySchedule,
  date: string,
  level: Level,
  candidates: readonly Entry[],
): PuzzleSpec | undefined {
  const scheduled = schedule.days[date];
  if (scheduled) return toSpec(scheduled, date, level);

  const dates = Object.keys(schedule.days);
  const end = dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : undefined;
  // A missing date inside the scheduled range means generation failed that day: hide it.
  if (end !== undefined && date <= end) return undefined;

  // Only scheduled days exclude; fallback days don't, so there is no recursion.
  const exclude = new Set<string>();
  for (let i = 1; i <= ANTI_REPEAT_DAYS; i++) {
    for (const p of schedule.days[addDays(date, -i)]?.placements ?? []) exclude.add(p.entryId);
  }
  const layout = generateDailyLayout(`${dailySeed(date, level)}:${CATALOGUE_VERSION}`, candidates, exclude);
  return layout ? toSpec(layout, date, level) : undefined;
}

export function getDailySpec(date: string, level: Level): PuzzleSpec | undefined {
  return dailySpecFrom(SCHEDULES[level], date, level, getEntries(level));
}

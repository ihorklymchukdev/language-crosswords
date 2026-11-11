import { addDays } from '../daily/dates';
import { dailyPuzzleId } from '../daily/daily';
import { LEVELS, type Level } from '../domain/levels';
import type { DailyCompletion, StoredPlay } from '../progress/storage';

export const MISSED_DAYS = 3;
export const MISSED_MAX_ROWS = 3;

export type DailyStatus = 'not-started' | 'in-progress' | 'solved';

export type DailyRef = { date: string; level: Level; status: DailyStatus };

export function isCompleted(completions: readonly DailyCompletion[], date: string, level: Level): boolean {
  return completions.some((c) => c.date === date && c.level === level);
}

// A completion outlives "Play again", so it wins over a cleared board.
export function dailyStatus(
  completions: readonly DailyCompletion[],
  plays: Readonly<Record<string, StoredPlay>>,
  date: string,
  level: Level,
): DailyStatus {
  if (isCompleted(completions, date, level)) return 'solved';
  const play = plays[dailyPuzzleId(date, level)];
  return play?.letters.some((l) => l !== null && l !== '') ? 'in-progress' : 'not-started';
}

type HasSpec = (date: string, level: Level) => boolean;

export function todaysDailies(
  today: string,
  completions: readonly DailyCompletion[],
  plays: Readonly<Record<string, StoredPlay>>,
  hasSpec: HasSpec,
): DailyRef[] {
  return LEVELS.filter((level) => hasSpec(today, level)).map((level) => ({
    date: today,
    level,
    status: dailyStatus(completions, plays, today, level),
  }));
}

// Earliest local date the learner did anything with a daily: a completion or a stored daily play.
export function firstActivityDate(
  completions: readonly DailyCompletion[],
  plays: Readonly<Record<string, StoredPlay>>,
): string | undefined {
  const dates = [
    ...completions.map((c) => c.completedOn),
    ...Object.values(plays).flatMap((p) => (p.spec.kind === 'daily' && p.spec.date ? [p.spec.date] : [])),
  ];
  return dates.length === 0 ? undefined : dates.reduce((a, b) => (a < b ? a : b));
}

// Newest first, within a date in level order. Days before the learner's first activity aren't
// "missed": a new user has nothing to catch up on.
export function missedDailies(
  today: string,
  completions: readonly DailyCompletion[],
  plays: Readonly<Record<string, StoredPlay>>,
  hasSpec: HasSpec,
): DailyRef[] {
  const first = firstActivityDate(completions, plays);
  if (first === undefined) return [];
  const out: DailyRef[] = [];
  for (let i = 1; i <= MISSED_DAYS; i++) {
    const date = addDays(today, -i);
    if (date < first) break;
    for (const level of LEVELS) {
      if (!hasSpec(date, level) || isCompleted(completions, date, level)) continue;
      out.push({ date, level, status: dailyStatus(completions, plays, date, level) });
    }
  }
  return out.slice(0, MISSED_MAX_ROWS);
}

export function streakLine(streak: number, solvedToday: boolean): string {
  if (streak === 0) return 'Start your streak today';
  const days = `${streak}-day streak`;
  return solvedToday ? days : `${days} · solve one today to keep it going`;
}

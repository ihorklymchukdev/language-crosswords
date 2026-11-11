import { addDays } from '../daily/dates';
import { dailyPuzzleId } from '../daily/daily';
import { LEVELS, type Level } from '../domain/levels';
import type { DailyCompletion, StoredPlay } from '../progress/storage';

export const MISSED_DAYS = 3;

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

// Newest date first; within a date, level order.
export function missedDailies(
  today: string,
  completions: readonly DailyCompletion[],
  plays: Readonly<Record<string, StoredPlay>>,
  hasSpec: HasSpec,
): DailyRef[] {
  const out: DailyRef[] = [];
  for (let i = 1; i <= MISSED_DAYS; i++) {
    const date = addDays(today, -i);
    for (const level of LEVELS) {
      if (!hasSpec(date, level) || isCompleted(completions, date, level)) continue;
      out.push({ date, level, status: dailyStatus(completions, plays, date, level) });
    }
  }
  return out;
}

export function streakLine(streak: number, solvedToday: boolean): string {
  if (streak === 0) return 'Start your streak today';
  const days = `${streak}-day streak`;
  return solvedToday ? days : `${days} · solve one today to keep it going`;
}

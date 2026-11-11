import { addDays } from '../daily/dates';
import type { DailyCompletion } from './storage';

export function currentStreak(completions: readonly DailyCompletion[], today: string): number {
  // Only dailies finished on their own day count; catching up a missed one doesn't.
  const days = new Set(completions.filter((c) => c.date === c.completedOn).map((c) => c.date));
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

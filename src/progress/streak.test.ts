import type { DailyCompletion } from './storage';
import { currentStreak } from './streak';

const done = (date: string, completedOn = date, level: DailyCompletion['level'] = 'A2'): DailyCompletion => ({
  date,
  level,
  completedOn,
});

describe('currentStreak', () => {
  it('counts consecutive days and ignores missed-daily completions', () => {
    const c = [done('2026-11-09'), done('2026-11-10'), done('2026-11-11'), done('2026-11-08', '2026-11-11')];
    expect(currentStreak(c, '2026-11-11')).toBe(3);
    expect(currentStreak([done('2026-11-10', '2026-11-11')], '2026-11-11')).toBe(0);
  });

  it('survives when today not yet played', () => {
    expect(currentStreak([done('2026-11-09'), done('2026-11-10')], '2026-11-11')).toBe(2);
  });

  it('resets after a gap', () => {
    expect(currentStreak([done('2026-11-08'), done('2026-11-09')], '2026-11-11')).toBe(0);
    expect(currentStreak([done('2026-11-07'), done('2026-11-09'), done('2026-11-10')], '2026-11-10')).toBe(2);
  });

  it('multiple levels same day count once', () => {
    const c = [done('2026-11-10', undefined, 'A2'), done('2026-11-10', undefined, 'B1'), done('2026-11-11', undefined, 'B2')];
    expect(currentStreak(c, '2026-11-11')).toBe(2);
  });
});

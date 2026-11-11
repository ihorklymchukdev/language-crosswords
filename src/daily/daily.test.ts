import { fixtureEntries } from '../generator/test-fixtures';
import { addDays, localDateKey } from './dates';
import { dailySpecFrom, getDailySpec, type DailySchedule } from './daily';

describe('dates', () => {
  it('localDateKey uses local fields', () => {
    expect(localDateKey(new Date(2027, 0, 5, 23, 59))).toBe('2027-01-05');
    expect(localDateKey(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05');
  });

  it('addDays crosses DST boundary', () => {
    expect(addDays('2027-03-27', 1)).toBe('2027-03-28');
    expect(addDays('2027-03-28', 1)).toBe('2027-03-29');
    expect(addDays('2027-10-31', -1)).toBe('2027-10-30');
    expect(addDays('2027-10-30', 2)).toBe('2027-11-01');
  });
});

describe('daily specs', () => {
  const candidates = fixtureEntries(300);

  it('getDailySpec is identical across calls', () => {
    const a = getDailySpec('2031-05-05', 'A2');
    const b = getDailySpec('2031-05-05', 'A2');
    expect(b).toEqual(a);
  });

  it('serves the scheduled layout with the daily id', () => {
    const schedule: DailySchedule = {
      version: 1,
      days: { '2026-11-01': { rows: 3, cols: 3, placements: [{ entryId: 'es-A2-sol', row: 0, col: 0, direction: 'across' }] } },
    };
    const spec = dailySpecFrom(schedule, '2026-11-01', 'B1', candidates);
    expect(spec).toMatchObject({ id: 'daily-B1-2026-11-01', kind: 'daily', date: '2026-11-01', level: 'B1', rows: 3, cols: 3 });
  });

  it('returns undefined for a gap inside the schedule range', () => {
    const schedule: DailySchedule = {
      version: 1,
      days: {
        '2026-11-01': { rows: 3, cols: 3, placements: [] },
        '2026-11-03': { rows: 3, cols: 3, placements: [] },
      },
    };
    expect(dailySpecFrom(schedule, '2026-11-02', 'A2', candidates)).toBeUndefined();
  });

  it('fallback daily excludes previous 7 days scheduled entries', () => {
    const base = dailySpecFrom({ version: 1, days: {} }, '2026-12-10', 'A2', candidates);
    expect(base).toBeDefined();
    const used = base!.placements.map((p) => p.entryId);
    const schedule: DailySchedule = {
      version: 1,
      days: {
        '2026-12-05': { rows: 7, cols: 7, placements: used.map((entryId, i) => ({ entryId, row: i, col: 0, direction: 'across' as const })) },
      },
    };
    const spec = dailySpecFrom(schedule, '2026-12-10', 'A2', candidates);
    expect(spec).toBeDefined();
    const ids = new Set(used);
    expect(spec!.placements.every((p) => !ids.has(p.entryId))).toBe(true);
  });

  it('fallback daily ignores scheduled days older than 7 days', () => {
    const base = dailySpecFrom({ version: 1, days: {} }, '2026-12-20', 'A2', candidates)!;
    const schedule: DailySchedule = {
      version: 1,
      days: {
        '2026-12-01': { rows: 7, cols: 7, placements: base.placements },
      },
    };
    expect(dailySpecFrom(schedule, '2026-12-20', 'A2', candidates)!.placements).toEqual(base.placements);
  });
});

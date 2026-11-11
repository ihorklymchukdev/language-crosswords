import { dailyPuzzleId } from '../daily/daily';
import type { Level } from '../domain/levels';
import type { DailyCompletion, StoredPlay } from '../progress/storage';
import { formatLongDate, formatShortDate } from '../ui/format';
import { dailyStatus, missedDailies, todaysDailies } from './today';

const TODAY = '2026-11-01';
const done = (date: string, level: Level, completedOn = date): DailyCompletion => ({ date, level, completedOn });
const always = () => true;

function play(date: string, level: Level, letters: (string | null)[]): Record<string, StoredPlay> {
  const id = dailyPuzzleId(date, level);
  return {
    [id]: {
      puzzleId: id,
      letters,
      revealed: letters.map(() => false),
      translated: [],
      cursor: 0,
      direction: 'across',
      elapsedMs: 0,
      spec: { id, kind: 'daily', level, date, rows: 1, cols: letters.length, placements: [] },
    },
  };
}

describe('dailyStatus', () => {
  it('needs at least one typed letter to count as in progress', () => {
    expect(dailyStatus([], play(TODAY, 'B1', [null, null]), TODAY, 'B1')).toBe('not-started');
    expect(dailyStatus([], play(TODAY, 'B1', [null, 'a']), TODAY, 'B1')).toBe('in-progress');
  });

  it('stays solved after the board is cleared with Play again', () => {
    expect(dailyStatus([done(TODAY, 'B1')], play(TODAY, 'B1', [null, null]), TODAY, 'B1')).toBe('solved');
  });

  it('does not take a completion from another level or date', () => {
    const c = [done(TODAY, 'A2'), done('2026-10-31', 'B1')];
    expect(dailyStatus(c, {}, TODAY, 'B1')).toBe('not-started');
  });
});

describe('todaysDailies', () => {
  it('hides a level with no puzzle for today', () => {
    const refs = todaysDailies(TODAY, [], {}, (_d, level) => level !== 'B2');
    expect(refs.map((r) => r.level)).toEqual(['A2', 'B1']);
  });
});

describe('missedDailies', () => {
  it('lists the previous 3 days newest first, crossing a month boundary', () => {
    const refs = missedDailies(TODAY, [], {}, (_d, level) => level === 'A2');
    expect(refs.map((r) => r.date)).toEqual(['2026-10-31', '2026-10-30', '2026-10-29']);
  });

  it('never includes today or the 4th day back', () => {
    const dates = new Set(missedDailies(TODAY, [], {}, always).map((r) => r.date));
    expect(dates.has(TODAY)).toBe(false);
    expect(dates.has('2026-10-28')).toBe(false);
  });

  it('drops completed dailies, including ones caught up later', () => {
    const c = [done('2026-10-31', 'A2'), done('2026-10-30', 'B2', TODAY)];
    const refs = missedDailies(TODAY, c, {}, always).map((r) => `${r.date} ${r.level}`);
    expect(refs).not.toContain('2026-10-31 A2');
    expect(refs).not.toContain('2026-10-30 B2');
    expect(refs).toContain('2026-10-31 B1');
    expect(refs).toHaveLength(7);
  });

  it('skips dates with no puzzle at that level', () => {
    const refs = missedDailies(TODAY, [], {}, (date, level) => !(date === '2026-10-30' && level === 'B1'));
    expect(refs.map((r) => `${r.date} ${r.level}`)).not.toContain('2026-10-30 B1');
    expect(refs).toHaveLength(8);
  });

  it('marks a missed daily that was started as in progress', () => {
    const refs = missedDailies(TODAY, [], play('2026-10-30', 'B1', ['c']), always);
    expect(refs.find((r) => r.date === '2026-10-30' && r.level === 'B1')?.status).toBe('in-progress');
  });
});

describe('date labels', () => {
  it('uses local calendar fields for weekday and month', () => {
    expect(formatLongDate('2026-11-11')).toBe('Wednesday, 11 November');
    expect(formatShortDate('2026-03-29')).toBe('Sun 29 Mar');
  });
});

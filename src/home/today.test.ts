import { dailyPuzzleId } from '../daily/daily';
import type { Level } from '../domain/levels';
import type { DailyCompletion, StoredPlay } from '../progress/storage';
import { formatLongDate, formatShortDate } from '../ui/format';
import { dailyStatus, latestUnfinishedPractice, missedDailies, todaysDailies } from './today';

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
  // Activity well before the 3-day window, so every window date is eligible.
  const veteran = [done('2026-10-01', 'A2')];
  const key = (r: { date: string; level: Level }) => `${r.date} ${r.level}`;

  it('fresh install has no missed dailies', () => {
    expect(missedDailies(TODAY, [], {}, always)).toEqual([]);
  });

  it('missed only after first activity', () => {
    const firstOpened = play('2026-10-30', 'B2', [null]);
    const refs = missedDailies(TODAY, [], firstOpened, (_d, level) => level === 'A2');
    expect(refs.map((r) => r.date)).toEqual(['2026-10-31', '2026-10-30']);
  });

  it('counts a completion by the day it was done, not the puzzle date', () => {
    expect(missedDailies(TODAY, [done('2026-10-29', 'A2', TODAY)], {}, always)).toEqual([]);
  });

  it('caps at 3 rows, most recent first', () => {
    const refs = missedDailies(TODAY, veteran, {}, always);
    expect(refs.map(key)).toEqual(['2026-10-31 A2', '2026-10-31 B1', '2026-10-31 B2']);
  });

  it('looks back 3 days only, crossing a month boundary', () => {
    const refs = missedDailies(TODAY, veteran, {}, (date, level) => level === 'A2' || date === '2026-10-28');
    expect(refs.map((r) => r.date)).toEqual(['2026-10-31', '2026-10-30', '2026-10-29']);
  });

  it('drops completed dailies, including ones caught up later', () => {
    const c = [...veteran, done('2026-10-31', 'A2'), done('2026-10-31', 'B2', TODAY)];
    expect(missedDailies(TODAY, c, {}, always).map(key)).toEqual(['2026-10-31 B1', '2026-10-30 A2', '2026-10-30 B1']);
  });

  it('skips dates with no puzzle at that level', () => {
    const refs = missedDailies(TODAY, veteran, {}, (date, level) => !(date === '2026-10-31' && level === 'B1'));
    expect(refs.map(key)).toEqual(['2026-10-31 A2', '2026-10-31 B2', '2026-10-30 A2']);
  });

  it('marks a missed daily that was started as in progress', () => {
    const refs = missedDailies(TODAY, veteran, play('2026-10-31', 'B1', ['c']), always);
    expect(refs.find((r) => r.level === 'B1')?.status).toBe('in-progress');
  });
});

describe('latestUnfinishedPractice', () => {
  const practice = (id: string, completedAt?: number): Record<string, StoredPlay> => {
    const base = Object.values(play(TODAY, 'B1', ['a']))[0]!;
    const spec = { ...base.spec, id, kind: 'practice' as const, date: undefined };
    return { [id]: { ...base, puzzleId: id, spec, ...(completedAt !== undefined ? { completedAt } : {}) } };
  };

  it('picks the most recently saved unfinished practice, skipping solved ones and dailies', () => {
    const plays = { ...practice('old'), ...practice('newer'), ...practice('solved', 1000), ...play(TODAY, 'A2', ['a']) };
    expect(latestUnfinishedPractice(plays, always)?.spec.id).toBe('newer');
  });

  it('has nothing to continue when every practice is solved', () => {
    expect(latestUnfinishedPractice({ ...practice('solved', 1000), ...play(TODAY, 'A2', ['a']) }, always)).toBeUndefined();
  });

  it('skips a newer practice whose words no longer resolve', () => {
    const plays = { ...practice('older'), ...practice('broken') };
    expect(latestUnfinishedPractice(plays, (spec) => spec.id !== 'broken')?.spec.id).toBe('older');
  });
});

describe('date labels', () => {
  it('uses local calendar fields for weekday and month', () => {
    expect(formatLongDate('2026-11-11')).toBe('Wednesday, 11 November');
    expect(formatShortDate('2026-03-29')).toBe('Sun 29 Mar');
  });
});

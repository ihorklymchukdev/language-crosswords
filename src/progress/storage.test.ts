jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PuzzleSpec } from '../domain/types';
import { isValidPlay, loadState, parseState, parseStateChecked, prunePlays, readState, saveState, type StoredPlay } from './storage';

describe('parseState', () => {
  it('loadState returns defaults on corrupt JSON', () => {
    for (const raw of [null, '{nope', '"str"', '[]']) {
      const s = parseState(raw);
      expect(s.schemaVersion).toBe(1);
      expect(s.plays).toEqual({});
      expect(s.dailyCompletions).toEqual([]);
      expect(s.practiceHistory).toEqual({ A2: [], B1: [], B2: [] });
    }
  });

  it('migrates v0 to current', () => {
    const play = { puzzleId: 'p1', letters: [null], revealed: [false], translated: [], cursor: 0, direction: 'across', elapsedMs: 0, spec: { id: 'p1', placements: [] } };
    const s = parseState(JSON.stringify({ plays: { p1: play } }));
    expect(s.schemaVersion).toBe(1);
    expect(s.plays['p1']).toEqual(play);
    expect(s.dailyCompletions).toEqual([]);
    expect(s.practiceHistory.A2).toEqual([]);
  });

  it('keeps valid current-version data and drops malformed fields', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      plays: {},
      dailyCompletions: [{ date: '2026-11-01', level: 'A2', completedOn: '2026-11-01' }, { bogus: true }],
      practiceHistory: { A2: [['a', 'b']], B1: 'x' },
    });
    const s = parseState(raw);
    expect(s.dailyCompletions).toHaveLength(1);
    expect(s.practiceHistory.A2).toEqual([['a', 'b']]);
    expect(s.practiceHistory.B1).toEqual([]);
  });
});

describe('loadState / saveState', () => {
  it('round-trips through AsyncStorage', async () => {
    const s = parseState(null);
    s.dailyCompletions.push({ date: '2026-11-01', level: 'A2', completedOn: '2026-11-01' });
    await saveState(s);
    expect(await loadState()).toEqual(s);
  });
});

const mkPlay = (kind: 'daily' | 'practice', id: string, date?: string): StoredPlay => ({
  puzzleId: id,
  letters: [null],
  revealed: [false],
  translated: [],
  cursor: 0,
  direction: 'across',
  elapsedMs: 0,
  spec: { id, kind, level: 'A2', rows: 1, cols: 1, placements: [], ...(date ? { date } : {}) } as PuzzleSpec,
});

describe('storage safety', () => {
  it('readState flags a failed read as not writable', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    expect((await readState()).writable).toBe(false);
    expect((await readState()).writable).toBe(true);
  });

  it('newer schemaVersion yields defaults and is not writable', () => {
    const r = parseStateChecked(JSON.stringify({ schemaVersion: 2, plays: { p: mkPlay('practice', 'p') } }));
    expect(r.writable).toBe(false);
    expect(r.state.plays).toEqual({});
  });

  it('parseState drops malformed plays', () => {
    const good = mkPlay('practice', 'good');
    const s = parseState(JSON.stringify({ schemaVersion: 1, plays: { good, a: { puzzleId: 'a' }, b: { ...good, letters: 'x' } } }));
    expect(Object.keys(s.plays)).toEqual(['good']);
    expect(isValidPlay({ ...good, elapsedMs: 'x' })).toBe(false);
  });

  it('prunePlays keeps recent dailies and the 20 latest practice plays', () => {
    const plays: Record<string, StoredPlay> = {
      old: mkPlay('daily', 'old', '2026-10-01'),
      recent: mkPlay('daily', 'recent', '2026-11-05'),
    };
    for (let i = 0; i < 25; i++) plays[`p${i}`] = mkPlay('practice', `p${i}`);
    const kept = Object.keys(prunePlays(plays, '2026-11-11'));
    expect(kept).toContain('recent');
    expect(kept).not.toContain('old');
    expect(kept.filter((k) => k.startsWith('p'))).toHaveLength(20);
    expect(kept).toContain('p24');
    expect(kept).not.toContain('p4');
  });
});

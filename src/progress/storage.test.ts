jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { loadState, parseState, saveState } from './storage';

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
    const play = { puzzleId: 'p1', spec: { id: 'p1' } };
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

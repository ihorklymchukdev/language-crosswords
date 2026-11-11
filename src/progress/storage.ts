import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVELS, type Level } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import type { PlayState } from '../play/play-state';

const STORAGE_KEY = 'lc:state';

export type DailyCompletion = { date: string; level: Level; completedOn: string };
export type StoredPlay = PlayState & { spec: PuzzleSpec };
export type StoredState = {
  schemaVersion: 1;
  plays: Record<string, StoredPlay>;
  dailyCompletions: DailyCompletion[];
  practiceHistory: Record<Level, string[][]>;
};

export function defaultState(): StoredState {
  return {
    schemaVersion: 1,
    plays: {},
    dailyCompletions: [],
    practiceHistory: Object.fromEntries(LEVELS.map((l) => [l, []])) as unknown as Record<Level, string[][]>,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isLevel = (v: unknown): v is Level => LEVELS.some((l) => l === v);

function isCompletion(v: unknown): v is DailyCompletion {
  return (
    isRecord(v) && typeof v['date'] === 'string' && isLevel(v['level']) && typeof v['completedOn'] === 'string'
  );
}

// v0 had only `plays`; every field is validated so a bad one resets to its default.
export function parseState(raw: string | null): StoredState {
  const state = defaultState();
  if (raw === null) return state;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!isRecord(data)) return state;

  if (isRecord(data['plays'])) state.plays = data['plays'] as Record<string, StoredPlay>;
  if (Array.isArray(data['dailyCompletions'])) state.dailyCompletions = data['dailyCompletions'].filter(isCompletion);
  const history = data['practiceHistory'];
  if (isRecord(history)) {
    for (const level of LEVELS) {
      const h = history[level];
      if (Array.isArray(h)) {
        state.practiceHistory[level] = h.filter(
          (ids): ids is string[] => Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
        );
      }
    }
  }
  return state;
}

export async function loadState(): Promise<StoredState> {
  try {
    return parseState(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultState();
  }
}

export async function saveState(state: StoredState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; the in-memory state keeps the session going.
  }
}

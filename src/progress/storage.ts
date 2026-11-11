import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVELS, type Level } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import { addDays, localDateKey } from '../daily/dates';
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

const isArrayOf = (v: unknown, type: 'string' | 'number' | 'boolean' | 'any'): boolean =>
  Array.isArray(v) && (type === 'any' || v.every((x) => x === null || typeof x === type));

export function isValidPlay(v: unknown): v is StoredPlay {
  if (!isRecord(v) || !isRecord(v['spec'])) return false;
  return (
    Array.isArray(v['spec']['placements']) &&
    isArrayOf(v['letters'], 'string') &&
    isArrayOf(v['revealed'], 'boolean') &&
    isArrayOf(v['translated'], 'number') &&
    typeof v['elapsedMs'] === 'number'
  );
}

const DAILY_PLAY_KEEP_DAYS = 14;
const PRACTICE_PLAY_KEEP = 20;

// Plays are re-inserted on save, so key order is least to most recently updated.
export function prunePlays(plays: Record<string, StoredPlay>, today: string): Record<string, StoredPlay> {
  const cutoff = addDays(today, -DAILY_PLAY_KEEP_DAYS);
  const entries = Object.entries(plays);
  const practice = entries.filter(([, p]) => p.spec.kind !== 'daily').slice(-PRACTICE_PLAY_KEEP);
  const keepPractice = new Set(practice.map(([id]) => id));
  return Object.fromEntries(
    entries.filter(([id, p]) => (p.spec.kind === 'daily' ? (p.spec.date ?? '') >= cutoff : keepPractice.has(id))),
  );
}

export type ParsedState = { state: StoredState; writable: boolean };

// v0 had only `plays`; every field is validated so a bad one resets to its default.
// A newer schemaVersion is read-only so an old build never overwrites newer data.
export function parseStateChecked(raw: string | null): ParsedState {
  const state = defaultState();
  if (raw === null) return { state, writable: true };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { state, writable: true };
  }
  if (!isRecord(data)) return { state, writable: true };
  if (typeof data['schemaVersion'] === 'number' && data['schemaVersion'] > 1) return { state, writable: false };

  if (isRecord(data['plays'])) {
    state.plays = Object.fromEntries(Object.entries(data['plays']).filter(([, p]) => isValidPlay(p))) as Record<
      string,
      StoredPlay
    >;
  }
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
  return { state, writable: true };
}

export function parseState(raw: string | null): StoredState {
  return parseStateChecked(raw).state;
}

// writable=false means the stored blob could not be read or is newer: never overwrite it.
export async function readState(): Promise<ParsedState> {
  try {
    return parseStateChecked(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return { state: defaultState(), writable: false };
  }
}

export async function loadState(): Promise<StoredState> {
  return (await readState()).state;
}

export async function saveState(state: StoredState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, plays: prunePlays(state.plays, localDateKey()) }));
  } catch {
    // Persistence is best-effort; the in-memory state keeps the session going.
  }
}

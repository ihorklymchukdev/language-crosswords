import { AppState, Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Level } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import type { PlayState } from '../play/play-state';
import { defaultState, readState, saveState, type DailyCompletion, type StoredState } from './storage';

const PRACTICE_HISTORY_SIZE = 10;
const SAVE_DEBOUNCE_MS = 300;

type ProgressApi = {
  state: StoredState;
  ready: boolean;
  savePlay: (id: string, play: PlayState & { spec: PuzzleSpec }) => void;
  recordDailyCompletion: (c: DailyCompletion) => void;
  recordPractice: (level: Level, entryIds: string[]) => void;
};

const ProgressContext = createContext<ProgressApi | undefined>(undefined);

function withoutKey<T>(rec: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(defaultState);
  const [ready, setReady] = useState(false);
  const latest = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Chains writes so they hit storage in order and the last one wins.
  const writeChain = useRef<Promise<void>>(Promise.resolve());
  const loaded = useRef(false);
  const writable = useRef(false);
  const replaying = useRef(false);
  const queued = useRef<((s: StoredState) => StoredState)[]>([]);

  const flush = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
    if (!writable.current) return;
    const snapshot = latest.current;
    writeChain.current = writeChain.current.then(() => saveState(snapshot));
  }, []);

  const update = useCallback(
    (fn: (s: StoredState) => StoredState) => {
      if (!loaded.current) {
        queued.current.push(fn);
        return;
      }
      latest.current = fn(latest.current);
      setState(latest.current);
      if (timer.current !== undefined) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    let cancelled = false;
    void readState().then((r) => {
      if (cancelled) return;
      loaded.current = true;
      writable.current = r.writable;
      // Updates made before the load finished are replayed in order onto the stored state.
      replaying.current = true;
      latest.current = queued.current.reduce((acc, fn) => fn(acc), r.state);
      replaying.current = false;
      const hadQueued = queued.current.length > 0;
      queued.current = [];
      setState(latest.current);
      setReady(true);
      if (hadQueued) timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && timer.current !== undefined) flush();
    });
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && timer.current !== undefined) flush();
    };
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      sub.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', onVisibility);
      if (timer.current !== undefined) flush();
    };
  }, [flush]);

  const savePlay = useCallback<ProgressApi['savePlay']>(
    (id, play) =>
      update((s) => {
        // A pre-load save is a fresh blank play; it must not clobber saved progress.
        if (replaying.current && s.plays[id] !== undefined) return s;
        return { ...s, plays: { ...withoutKey(s.plays, id), [id]: play } };
      }),
    [update],
  );

  const recordDailyCompletion = useCallback<ProgressApi['recordDailyCompletion']>(
    (c) =>
      update((s) =>
        s.dailyCompletions.some((x) => x.date === c.date && x.level === c.level)
          ? s
          : { ...s, dailyCompletions: [...s.dailyCompletions, c] },
      ),
    [update],
  );

  const recordPractice = useCallback<ProgressApi['recordPractice']>(
    (level, entryIds) =>
      update((s) => ({
        ...s,
        practiceHistory: {
          ...s.practiceHistory,
          [level]: [...s.practiceHistory[level], entryIds].slice(-PRACTICE_HISTORY_SIZE),
        },
      })),
    [update],
  );

  const value = useMemo(
    () => ({ state, ready, savePlay, recordDailyCompletion, recordPractice }),
    [state, ready, savePlay, recordDailyCompletion, recordPractice],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

// Screens must wait for `ready` before reading or saving plays.
export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

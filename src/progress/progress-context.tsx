import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Level } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import type { PlayState } from '../play/play-state';
import { defaultState, loadState, saveState, type DailyCompletion, type StoredState } from './storage';

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

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(defaultState);
  const [ready, setReady] = useState(false);
  const latest = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Chains writes so they hit storage in order and the last one wins.
  const writeChain = useRef<Promise<void>>(Promise.resolve());
  const loaded = useRef(false);

  const flush = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
    const snapshot = latest.current;
    writeChain.current = writeChain.current.then(() => saveState(snapshot));
  }, []);

  const update = useCallback(
    (fn: (s: StoredState) => StoredState) => {
      latest.current = fn(latest.current);
      setState(latest.current);
      if (!loaded.current) return;
      if (timer.current !== undefined) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    let cancelled = false;
    void loadState().then((s) => {
      if (cancelled) return;
      loaded.current = true;
      latest.current = s;
      setState(s);
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (timer.current !== undefined) flush();
    };
  }, [flush]);

  const savePlay = useCallback<ProgressApi['savePlay']>(
    (id, play) => update((s) => ({ ...s, plays: { ...s.plays, [id]: play } })),
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

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

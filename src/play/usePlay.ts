import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { keyToAction, uiReducer, type UiAction } from './navigation';
import { greenCells, type PlayState } from './play-state';
import type { Puzzle } from './puzzle';

const TICK_MS = 1000;
// A stalled JS thread or a throttled tab must not add a long jump to the clock.
const MAX_TICK_MS = 2000;

type Options = {
  puzzle: Puzzle;
  initial: PlayState;
  onChange: (s: PlayState) => void;
  onComplete: (s: PlayState) => void;
  physicalKeys: boolean;
};

export type PlayController = { state: PlayState; dispatch: Dispatch<UiAction>; green: boolean[] };

const isForeground = (s: AppStateStatus | string | null | undefined) => s !== 'background' && s !== 'inactive';

function useAppActive(): boolean {
  const [active, setActive] = useState(() => isForeground(AppState.currentState));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(isForeground(s)));
    return () => sub.remove();
  }, []);
  return active;
}

// The puzzle must stay the same for the hook's lifetime; key the screen by puzzle id.
export function usePlay({ puzzle, initial, onChange, onComplete, physicalKeys }: Options): PlayController {
  const [state, dispatch] = useReducer((s: PlayState, a: UiAction) => uiReducer(puzzle, s, a), initial);
  const green = useMemo(() => greenCells(puzzle, state), [puzzle, state.letters, state.revealed]);

  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);
  onChangeRef.current = onChange;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    onChangeRef.current(state);
  }, [state]);

  const wasComplete = useRef(initial.completedAt !== undefined);
  useEffect(() => {
    const done = state.completedAt !== undefined;
    if (done && !wasComplete.current) onCompleteRef.current(state);
    wasComplete.current = done;
    // Only the transition matters; `state` is read at that moment.
  }, [state.completedAt]);

  const focused = useIsFocused();
  const appActive = useAppActive();
  const running = focused && appActive && state.completedAt === undefined;
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      dispatch({ type: 'tick', ms: Math.min(now - last, MAX_TICK_MS) });
      last = now;
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // Off once solved so Tab, Space and Enter reach the completion card's buttons.
  const keysOn = Platform.OS === 'web' && physicalKeys && focused && state.completedAt === undefined;
  useEffect(() => {
    if (!keysOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const action = keyToAction(e.key, e.shiftKey);
      if (!action) return;
      // Capture phase + stop: a focused Pressable would otherwise also react to Space.
      e.preventDefault();
      e.stopPropagation();
      dispatch(action);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [keysOn]);

  return { state, dispatch, green };
}

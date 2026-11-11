import { initialPlayState, type PlayState } from './play-state';
import type { Puzzle } from './puzzle';

// Stored plays come from disk and may predate fields or not fit the puzzle; anything off falls back to fresh values.
export function restorePlay(p: Puzzle, stored: PlayState | undefined): PlayState {
  const fresh = initialPlayState(p);
  if (!stored) return fresh;
  const n = p.solution.length;
  if (stored.letters.length !== n || stored.revealed.length !== n) return fresh;

  const cursorOk =
    Number.isInteger(stored.cursor) && stored.cursor >= 0 && stored.cursor < n && p.solution[stored.cursor] != null;
  const cursor = cursorOk ? stored.cursor : fresh.cursor;
  const wanted = stored.direction === 'down' || stored.direction === 'across' ? stored.direction : fresh.direction;
  const fits = (d: PlayState['direction']) => p.slots.some((s) => s.direction === d && s.cells.includes(cursor));
  const direction = fits(wanted) ? wanted : wanted === 'across' ? 'down' : 'across';

  return {
    puzzleId: fresh.puzzleId,
    letters: stored.letters.map((l, i) => (p.solution[i] == null ? null : l)),
    revealed: stored.revealed.slice(),
    translated: [...new Set(stored.translated)].filter((i) => Number.isInteger(i) && i >= 0 && i < p.slots.length),
    cursor,
    direction,
    elapsedMs: Number.isFinite(stored.elapsedMs) ? Math.max(0, stored.elapsedMs) : 0,
    ...(typeof stored.completedAt === 'number' ? { completedAt: stored.completedAt } : {}),
  };
}

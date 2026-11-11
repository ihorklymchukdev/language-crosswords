import type { Direction } from '../domain/types';
import { greenCells, playReducer, type PlayAction, type PlayState } from './play-state';
import type { Puzzle } from './puzzle';

export type Arrow = 'left' | 'right' | 'up' | 'down';

// Screen-level actions composed from the pure play reducer.
export type UiAction = PlayAction | { type: 'move'; arrow: Arrow } | { type: 'focusSlot'; index: number };

const hasSlot = (p: Puzzle, cell: number, d: Direction) =>
  p.slots.some((s) => s.direction === d && s.cells.includes(cell));

function pointAt(p: Puzzle, s: PlayState, cursor: number, want: Direction): PlayState {
  if (hasSlot(p, cursor, want)) return { ...s, cursor, direction: want };
  if (hasSlot(p, cursor, s.direction)) return { ...s, cursor };
  return { ...s, cursor, direction: want === 'across' ? 'down' : 'across' };
}

function move(p: Puzzle, s: PlayState, arrow: Arrow): PlayState {
  const { rows, cols } = p.spec;
  const want: Direction = arrow === 'left' || arrow === 'right' ? 'across' : 'down';
  const r = Math.floor(s.cursor / cols) + (arrow === 'up' ? -1 : arrow === 'down' ? 1 : 0);
  const c = (s.cursor % cols) + (arrow === 'left' ? -1 : arrow === 'right' ? 1 : 0);
  const inside = r >= 0 && c >= 0 && r < rows && c < cols;
  // At an edge or a block the arrow still turns the cursor to its axis, like paper-style apps.
  const target = inside && p.solution[r * cols + c] != null ? r * cols + c : s.cursor;
  return pointAt(p, s, target, want);
}

function focusSlot(p: Puzzle, s: PlayState, index: number): PlayState {
  const slot = p.slots[index];
  if (!slot) return s;
  const green = greenCells(p, s);
  const open = (c: number) => !green[c] && !s.revealed[c];
  const cursor =
    slot.cells.find((c) => open(c) && s.letters[c] == null) ?? slot.cells.find(open) ?? slot.cells[0]!;
  return { ...s, cursor, direction: slot.direction };
}

export function uiReducer(p: Puzzle, s: PlayState, a: UiAction): PlayState {
  switch (a.type) {
    case 'move':
      return move(p, s, a.arrow);
    case 'focusSlot':
      return focusSlot(p, s, a.index);
    default:
      return playReducer(p, s, a);
  }
}

const SPANISH_LETTER = /^[a-zñáéíóúü]$/;
const ARROWS: Record<string, Arrow> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

export function keyToAction(key: string, shift: boolean): UiAction | undefined {
  const lower = key.toLowerCase();
  if (SPANISH_LETTER.test(lower)) return { type: 'type', letter: lower };
  if (key === 'Backspace') return { type: 'backspace' };
  if (key === 'Tab') return { type: 'nextSlot', delta: shift ? -1 : 1 };
  if (key === ' ') return { type: 'toggleDirection' };
  const arrow = ARROWS[key];
  return arrow ? { type: 'move', arrow } : undefined;
}

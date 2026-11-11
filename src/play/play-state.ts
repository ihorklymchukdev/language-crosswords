import type { Direction } from '../domain/types';
import { lettersMatch } from './matching';
import type { Puzzle, Slot } from './puzzle';

export type PlayState = {
  puzzleId: string;
  letters: (string | null)[];
  revealed: boolean[];
  translated: number[];
  cursor: number;
  direction: Direction;
  elapsedMs: number;
  completedAt?: number;
};

export type PlayAction =
  | { type: 'select'; cell: number }
  | { type: 'type'; letter: string }
  | { type: 'backspace' }
  | { type: 'reveal' }
  | { type: 'translate' }
  | { type: 'toggleDirection' }
  | { type: 'nextSlot'; delta: 1 | -1 }
  | { type: 'tick'; ms: number }
  | { type: 'reset' };

const other = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

function slotAt(p: Puzzle, cell: number, direction: Direction): Slot | undefined {
  return p.slots.find((s) => s.direction === direction && s.cells.includes(cell));
}

function slotCorrect(p: Puzzle, s: PlayState, slot: Slot): boolean {
  return slot.cells.every((c) => {
    const typed = s.letters[c];
    const answer = p.solution[c];
    return typed != null && answer != null && lettersMatch(typed, answer);
  });
}

export function greenCells(p: Puzzle, s: PlayState): boolean[] {
  const correct = p.slots.map((slot) => slotCorrect(p, s, slot));
  const green = new Array<boolean>(p.solution.length).fill(false);
  const through = new Array<number>(p.solution.length).fill(0);
  const done = new Array<number>(p.solution.length).fill(0);
  p.slots.forEach((slot, i) => {
    for (const c of slot.cells) {
      through[c]! += 1;
      if (correct[i]) done[c]! += 1;
    }
  });
  for (let c = 0; c < green.length; c++) green[c] = through[c]! > 0 && through[c] === done[c];
  return green;
}

export function isComplete(p: Puzzle, s: PlayState): boolean {
  return p.slots.every((slot) => slotCorrect(p, s, slot));
}

export function activeSlot(p: Puzzle, s: PlayState): Slot | undefined {
  return slotAt(p, s.cursor, s.direction);
}

export function displayLetter(p: Puzzle, s: PlayState, cell: number): string {
  const answer = p.solution[cell];
  if (answer == null) return '';
  if (s.revealed[cell] || greenCells(p, s)[cell]) return answer;
  return s.letters[cell] ?? '';
}

export function initialPlayState(p: Puzzle): PlayState {
  const first = p.slots[0];
  return {
    puzzleId: p.spec.id,
    letters: new Array<string | null>(p.solution.length).fill(null),
    revealed: new Array<boolean>(p.solution.length).fill(false),
    translated: [],
    cursor: first?.cells[0] ?? 0,
    direction: first?.direction ?? 'across',
    elapsedMs: 0,
  };
}

// completedAt records elapsedMs at completion so the reducer stays pure.
function withCompletion(p: Puzzle, prev: PlayState, next: PlayState): PlayState {
  if (next.completedAt === undefined && isComplete(p, next)) {
    return { ...next, completedAt: next.elapsedMs };
  }
  return next;
}

function selectCell(p: Puzzle, s: PlayState, cell: number): PlayState {
  if (p.solution[cell] == null) return s;
  if (cell === s.cursor) {
    return slotAt(p, cell, other(s.direction)) ? { ...s, direction: other(s.direction) } : s;
  }
  if (slotAt(p, cell, s.direction)) return { ...s, cursor: cell };
  if (slotAt(p, cell, other(s.direction))) return { ...s, cursor: cell, direction: other(s.direction) };
  return s;
}

function typeLetter(p: Puzzle, s: PlayState, letter: string): PlayState {
  if (!/^\p{L}$/u.test(letter)) return s;
  const green = greenCells(p, s);
  let letters = s.letters;
  if (!green[s.cursor]) {
    letters = s.letters.slice();
    letters[s.cursor] = letter.toLowerCase();
  }
  const after = { ...s, letters };
  // Green is recomputed so a cell turned green by this keystroke is skipped like any other.
  const nowGreen = greenCells(p, after);
  const slot = activeSlot(p, s);
  let cursor = s.cursor;
  if (slot) {
    const next = slot.cells.slice(slot.cells.indexOf(s.cursor) + 1).find((c) => !nowGreen[c]);
    if (next !== undefined) cursor = next;
  }
  return withCompletion(p, s, { ...after, cursor });
}

function backspace(p: Puzzle, s: PlayState): PlayState {
  const green = greenCells(p, s);
  const clear = (cell: number, cursor: number): PlayState => {
    const letters = s.letters.slice();
    letters[cell] = null;
    return { ...s, letters, cursor };
  };
  if (!green[s.cursor] && s.letters[s.cursor] != null) return clear(s.cursor, s.cursor);
  const slot = activeSlot(p, s);
  if (!slot) return s;
  const i = slot.cells.indexOf(s.cursor);
  if (i <= 0) return s;
  const prev = slot.cells[i - 1]!;
  return green[prev] ? { ...s, cursor: prev } : clear(prev, prev);
}

function reveal(p: Puzzle, s: PlayState): PlayState {
  const answer = p.solution[s.cursor];
  if (answer == null) return s;
  const typed = s.letters[s.cursor];
  if (greenCells(p, s)[s.cursor] || (typed != null && lettersMatch(typed, answer))) return s;
  const letters = s.letters.slice();
  const revealed = s.revealed.slice();
  letters[s.cursor] = answer;
  revealed[s.cursor] = true;
  return withCompletion(p, s, { ...s, letters, revealed });
}

function nextSlot(p: Puzzle, s: PlayState, delta: 1 | -1): PlayState {
  const n = p.slots.length;
  if (n === 0) return s;
  const current = activeSlot(p, s);
  const from = current ? current.index : delta === 1 ? -1 : 0;
  const target = p.slots[(from + delta + n) % n]!;
  const green = greenCells(p, s);
  const cursor = target.cells.find((c) => !green[c]) ?? target.cells[0]!;
  return { ...s, cursor, direction: target.direction };
}

export function playReducer(p: Puzzle, s: PlayState, a: PlayAction): PlayState {
  switch (a.type) {
    case 'select':
      return selectCell(p, s, a.cell);
    case 'type':
      return typeLetter(p, s, a.letter);
    case 'backspace':
      return backspace(p, s);
    case 'reveal':
      return reveal(p, s);
    case 'translate': {
      const slot = activeSlot(p, s);
      if (!slot || s.translated.includes(slot.index)) return s;
      return { ...s, translated: [...s.translated, slot.index] };
    }
    case 'toggleDirection':
      return selectCell(p, s, s.cursor);
    case 'nextSlot':
      return nextSlot(p, s, a.delta);
    case 'tick':
      return s.completedAt !== undefined ? s : { ...s, elapsedMs: s.elapsedMs + a.ms };
    case 'reset':
      return { ...initialPlayState(p), puzzleId: s.puzzleId };
  }
}

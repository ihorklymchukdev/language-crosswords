import type { Entry, PuzzleSpec } from '../domain/types';
import { makeEntry } from '../generator/test-fixtures';
import {
  activeSlot,
  displayLetter,
  greenCells,
  initialPlayState,
  isComplete,
  playReducer,
  type PlayAction,
  type PlayState,
} from './play-state';
import { resolvePuzzle, type Puzzle } from './puzzle';

const entries = new Map<string, Entry>(
  ['gato', 'ojo', 'tos'].map((w) => [w, makeEntry(w, w)]),
);
const lookup = (id: string) => entries.get(id);

function spec(placements: PuzzleSpec['placements'], rows = 4, cols = 4): PuzzleSpec {
  return { id: 'p1', kind: 'practice', level: 'A2', rows, cols, placements };
}

// gato across (0,0); ojo down (0,3) shares 'o'; tos down (0,2) shares 't'.
const basic = (): Puzzle =>
  resolvePuzzle(
    spec([
      { entryId: 'gato', row: 0, col: 0, direction: 'across' },
      { entryId: 'ojo', row: 0, col: 3, direction: 'down' },
      { entryId: 'tos', row: 0, col: 2, direction: 'down' },
    ]),
    lookup,
  )!;

const run = (p: Puzzle, s: PlayState, ...actions: PlayAction[]) =>
  actions.reduce((acc, a) => playReducer(p, acc, a), s);
const typeAll = (p: Puzzle, s: PlayState, word: string) =>
  run(p, s, ...[...word].map((letter): PlayAction => ({ type: 'type', letter })));

describe('resolvePuzzle', () => {
  it('returns undefined for unknown entry id', () => {
    expect(resolvePuzzle(spec([{ entryId: 'nope', row: 0, col: 0, direction: 'across' }]), lookup)).toBeUndefined();
  });

  it('returns undefined on letter conflict or out of bounds', () => {
    expect(
      resolvePuzzle(
        spec([
          { entryId: 'gato', row: 0, col: 0, direction: 'across' },
          { entryId: 'ojo', row: 0, col: 2, direction: 'down' },
        ]),
        lookup,
      ),
    ).toBeUndefined();
    expect(resolvePuzzle(spec([{ entryId: 'gato', row: 0, col: 2, direction: 'across' }]), lookup)).toBeUndefined();
  });

  it('numbers slots in reading order, across before down', () => {
    const p = basic();
    expect(p.slots.map((s) => [s.number, s.direction, s.entry.word])).toEqual([
      [1, 'across', 'gato'],
      [2, 'down', 'tos'],
      [3, 'down', 'ojo'],
    ]);
  });
});

describe('play reducer', () => {
  it('typing advances along direction and skips green cells', () => {
    const p = basic();
    let s = run(p, initialPlayState(p), { type: 'select', cell: 2 }, { type: 'select', cell: 2 });
    s = typeAll(p, s, 'tos'); // tos complete; gato still empty so cell 2 is not green yet
    s = run(p, s, { type: 'select', cell: 0 });
    s = typeAll(p, s, 'gato'); // gato + tos complete; cell 3 still waits on ojo
    expect(greenCells(p, s)[2]).toBe(true);
    expect(greenCells(p, s)[3]).toBe(false);
    // From the first cell, advancing passes over the green cells 1 and 2 to land on cell 3.
    s = run(p, { ...s, cursor: 0, direction: 'across' }, { type: 'type', letter: 'x' });
    expect(s.letters[0]).toBe('g');
    expect(s.cursor).toBe(3);
  });

  it('backspace on empty cell steps back and clears', () => {
    const p = basic();
    let s = run(p, initialPlayState(p));
    s = typeAll(p, s, 'ga'); // cursor on cell 2, empty
    expect(s.cursor).toBe(2);
    s = run(p, s, { type: 'backspace' });
    expect(s.cursor).toBe(1);
    expect(s.letters[1]).toBeNull();
    expect(s.letters[0]).toBe('g');
  });

  it('backspace on a filled cell clears it and stays', () => {
    const p = basic();
    let s = typeAll(p, initialPlayState(p), 'gato');
    s = run(p, s, { type: 'select', cell: 1 });
    s = run(p, { ...s, letters: s.letters.map((l, i) => (i === 1 ? 'z' : l)) }, { type: 'backspace' });
    expect(s.cursor).toBe(1);
    expect(s.letters[1]).toBeNull();
  });

  it('cell shared by two accented words turns green with unaccented input', () => {
    const e = new Map<string, Entry>([
      ['café', makeEntry('café', 'café')],
    ]);
    // 'é' is the shared cell; typed unaccented.
    e.set('ébano', makeEntry('ébano', 'ébano'));
    const p = resolvePuzzle(
      spec(
        [
          { entryId: 'café', row: 0, col: 0, direction: 'across' },
          { entryId: 'ébano', row: 0, col: 3, direction: 'down' },
        ],
        5,
        4,
      ),
      (id) => e.get(id),
    )!;
    let s = initialPlayState(p);
    s = typeAll(p, s, 'cafe');
    expect(greenCells(p, s)[0]).toBe(true);
    expect(greenCells(p, s)[3]).toBe(false); // ébano still incomplete
    s = run(p, s, { type: 'select', cell: 3 });
    s = typeAll(p, s, 'ebano');
    expect(greenCells(p, s)[3]).toBe(true);
    expect(displayLetter(p, s, 3)).toBe('é');
    expect(isComplete(p, s)).toBe(true);
  });

  it('cell is not green when only one of its two words is correct', () => {
    const p = basic();
    const s = typeAll(p, initialPlayState(p), 'gato');
    const green = greenCells(p, s);
    expect(green[0]).toBe(true); // only gato passes through
    expect(green[2]).toBe(false); // shared with tos
    expect(green[3]).toBe(false); // shared with ojo
  });

  it('green cells ignore typing', () => {
    const p = basic();
    let s = typeAll(p, initialPlayState(p), 'gato');
    s = run(p, s, { type: 'select', cell: 0 }, { type: 'type', letter: 'z' });
    expect(s.letters[0]).toBe('g');
  });

  it('reveal fills the cursor cell and marks revealed', () => {
    const p = basic();
    let s = run(p, initialPlayState(p), { type: 'type', letter: 'z' }, { type: 'select', cell: 0 });
    s = run(p, s, { type: 'reveal' });
    expect(s.letters[0]).toBe('g');
    expect(s.revealed[0]).toBe(true);
    const again = run(p, s, { type: 'reveal' });
    expect(again).toBe(s);
  });

  it('translate records active slot once', () => {
    const p = basic();
    let s = run(p, initialPlayState(p), { type: 'translate' }, { type: 'translate' });
    expect(s.translated).toEqual([0]);
    s = run(p, s, { type: 'nextSlot', delta: 1 }, { type: 'translate' });
    expect(s.translated).toEqual([0, 1]);
  });

  it('select same cell toggles direction only when the other direction exists', () => {
    const p = basic();
    let s = initialPlayState(p);
    s = run(p, s, { type: 'select', cell: 0 });
    expect(s.direction).toBe('across'); // cell 0 has no down slot
    s = run(p, s, { type: 'select', cell: 2 });
    expect(s.direction).toBe('across');
    s = run(p, s, { type: 'select', cell: 2 });
    expect(s.direction).toBe('down');
    expect(activeSlot(p, s)?.entry.word).toBe('tos');
  });

  it('completedAt set when all correct, including fully revealed', () => {
    const p = basic();
    const typed = typeAll(p, initialPlayState(p), 'gato');
    expect(typed.completedAt).toBeUndefined();
    let s = run(p, initialPlayState(p));
    for (let cell = 0; cell < p.solution.length; cell++) {
      if (p.solution[cell] == null) continue;
      s = run(p, s, { type: 'select', cell }, { type: 'reveal' });
    }
    expect(isComplete(p, s)).toBe(true);
    expect(s.completedAt).toBeDefined();
    const ticked = run(p, s, { type: 'tick', ms: 500 });
    expect(ticked.elapsedMs).toBe(s.elapsedMs);
  });

  it('tick ignores NaN and negative ms', () => {
    const p = basic();
    const s = run(p, initialPlayState(p), { type: 'tick', ms: 100 });
    for (const ms of [NaN, Infinity, -5]) expect(run(p, s, { type: 'tick', ms }).elapsedMs).toBe(100);
  });

  it('reset keeps puzzleId and clears progress', () => {
    const p = basic();
    const s = run(p, typeAll(p, initialPlayState(p), 'ga'), { type: 'tick', ms: 100 }, { type: 'reset' });
    expect(s).toEqual(initialPlayState(p));
  });

  it('revealed cells are read-only for type and backspace', () => {
    const p = basic();
    // Reveal cell 3 (shared by gato and ojo) while both words are incomplete.
    let s = run(p, initialPlayState(p), { type: 'select', cell: 3 }, { type: 'reveal' });
    expect(s.letters[3]).toBe('o');
    s = run(p, s, { type: 'type', letter: 'z' });
    expect(s.letters[3]).toBe('o');
    s = run(p, s, { type: 'backspace' });
    expect(s.letters[3]).toBe('o');
    // Finishing the words still completes the puzzle.
    s = run(p, s, { type: 'select', cell: 0 });
    s = typeAll(p, s, 'gat');
    expect(s.cursor).toBe(2);
    s = run(p, s, { type: 'toggleDirection' });
    s = typeAll(p, s, 'tos');
    s = run(p, s, { type: 'select', cell: 7 });
    s = typeAll(p, s, 'jo');
    expect(isComplete(p, s)).toBe(true);
  });

  it('nextSlot wraps around and lands on the first non-green cell', () => {
    const p = basic();
    let s = run(p, initialPlayState(p), { type: 'nextSlot', delta: -1 });
    expect(activeSlot(p, s)?.entry.word).toBe('ojo');
    s = run(p, s, { type: 'nextSlot', delta: 1 });
    expect(activeSlot(p, s)?.entry.word).toBe('gato');
    // Make gato's cells 0,1 green via a completed gato, then enter it from tos.
    s = typeAll(p, s, 'gato');
    s = run(p, s, { type: 'nextSlot', delta: -1 }, { type: 'nextSlot', delta: 1 });
    expect(activeSlot(p, s)?.entry.word).toBe('gato');
    expect(s.cursor).toBe(2);
  });
});

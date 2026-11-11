import type { Entry } from '../domain/types';
import { makeEntry } from '../generator/test-fixtures';
import { uiReducer, type UiAction } from './navigation';
import { initialPlayState, type PlayState } from './play-state';
import { resolvePuzzle, type Puzzle } from './puzzle';
import { restorePlay } from './restore';

const entries = new Map<string, Entry>(['gato', 'ojo', 'tos'].map((w) => [w, makeEntry(w, w)]));

// 4x4:  g a t o / . . o j / . . s o — gato across, tos down at col 2, ojo down at col 3.
const puzzle = (): Puzzle =>
  resolvePuzzle(
    {
      id: 'p1',
      kind: 'practice',
      level: 'A2',
      rows: 4,
      cols: 4,
      placements: [
        { entryId: 'gato', row: 0, col: 0, direction: 'across' },
        { entryId: 'ojo', row: 0, col: 3, direction: 'down' },
        { entryId: 'tos', row: 0, col: 2, direction: 'down' },
      ],
    },
    (id) => entries.get(id),
  )!;

const run = (p: Puzzle, s: PlayState, ...actions: UiAction[]) => actions.reduce((acc, a) => uiReducer(p, acc, a), s);
const at = (s: PlayState, cursor: number, direction: PlayState['direction']): PlayState => ({ ...s, cursor, direction });

describe('arrow movement', () => {
  it('moves along the row and keeps the across direction', () => {
    const p = puzzle();
    const s = run(p, initialPlayState(p), { type: 'move', arrow: 'right' }, { type: 'move', arrow: 'right' });
    expect([s.cursor, s.direction]).toEqual([2, 'across']);
  });

  it('turns to down when stepping down into a down word', () => {
    const p = puzzle();
    const s = run(p, at(initialPlayState(p), 2, 'across'), { type: 'move', arrow: 'down' });
    expect([s.cursor, s.direction]).toEqual([6, 'down']);
  });

  it('only switches axis at the grid edge', () => {
    const p = puzzle();
    const s = run(p, at(initialPlayState(p), 3, 'across'), { type: 'move', arrow: 'up' });
    expect([s.cursor, s.direction]).toEqual([3, 'down']);
  });

  it('stays put next to a block and keeps a direction that has a word', () => {
    const p = puzzle();
    const s = run(p, at(initialPlayState(p), 6, 'down'), { type: 'move', arrow: 'left' });
    expect([s.cursor, s.direction]).toEqual([6, 'down']);
  });

  it('keeps down when the neighbour belongs to no across word', () => {
    const p = puzzle();
    const s = run(p, at(initialPlayState(p), 6, 'down'), { type: 'move', arrow: 'right' });
    expect([s.cursor, s.direction]).toEqual([7, 'down']);
  });
});

describe('focusSlot', () => {
  it('jumps to the first empty cell of the clue and takes its direction', () => {
    const p = puzzle();
    const ojo = p.slots.findIndex((s) => s.entry.word === 'ojo');
    const s = run(p, initialPlayState(p), { type: 'type', letter: 'g' }, { type: 'focusSlot', index: ojo });
    expect([s.cursor, s.direction]).toEqual([3, 'down']);
    const typed = run(p, s, { type: 'type', letter: 'o' }, { type: 'focusSlot', index: ojo });
    expect(typed.cursor).toBe(7);
  });

  it('on a filled clue lands on the first cell that is not green', () => {
    const p = puzzle();
    const slot = (w: string) => p.slots.findIndex((s) => s.entry.word === w);
    const type = (...ls: string[]) => ls.map((letter): UiAction => ({ type: 'type', letter }));
    const s = run(
      p,
      initialPlayState(p),
      ...type('g', 'a', 't', 'o'),
      { type: 'focusSlot', index: slot('tos') },
      ...type('x', 'x'),
      { type: 'focusSlot', index: slot('ojo') },
      ...type('x', 'x'),
      { type: 'focusSlot', index: slot('gato') },
    );
    // g and a belong only to the finished "gato", so they are green; t and o wait on their down words.
    expect(s.cursor).toBe(2);
  });
});

describe('restorePlay', () => {
  it('discards a stored play whose grid size does not match the puzzle', () => {
    const p = puzzle();
    const stored = { ...initialPlayState(p), letters: ['g'], elapsedMs: 9000 };
    expect(restorePlay(p, stored)).toEqual(initialPlayState(p));
  });

  it('keeps progress but repairs a cursor on a block and a direction with no word there', () => {
    const p = puzzle();
    const letters = initialPlayState(p).letters.slice();
    letters[0] = 'g';
    const onBlock = restorePlay(p, { ...initialPlayState(p), letters, cursor: 4, elapsedMs: 5000 });
    expect([onBlock.cursor, onBlock.letters[0], onBlock.elapsedMs]).toEqual([0, 'g', 5000]);

    const wrongAxis = restorePlay(p, { ...initialPlayState(p), cursor: 7, direction: 'across' });
    expect([wrongAxis.cursor, wrongAxis.direction]).toEqual([7, 'down']);
  });

  it('drops translated clue indexes that do not exist', () => {
    const p = puzzle();
    const s = restorePlay(p, { ...initialPlayState(p), translated: [1, 1, 7, -1] });
    expect(s.translated).toEqual([1]);
  });
});

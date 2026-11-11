import { getEntry } from '../catalogue/catalogue';
import type { Direction, Entry, PuzzleSpec } from '../domain/types';

export type Slot = { index: number; number: number; direction: Direction; entry: Entry; cells: number[] };
export type Puzzle = { spec: PuzzleSpec; slots: Slot[]; solution: (string | null)[] };

export function resolvePuzzle(
  spec: PuzzleSpec,
  lookup: (id: string) => Entry | undefined = getEntry,
): Puzzle | undefined {
  const { rows, cols } = spec;
  if (spec.placements.length === 0) return undefined;
  const solution: (string | null)[] = new Array<string | null>(rows * cols).fill(null);
  const raw: { direction: Direction; entry: Entry; cells: number[] }[] = [];

  for (const p of spec.placements) {
    const entry = lookup(p.entryId);
    if (!entry) return undefined;
    const cells: number[] = [];
    for (let i = 0; i < entry.word.length; i++) {
      const r = p.direction === 'down' ? p.row + i : p.row;
      const c = p.direction === 'across' ? p.col + i : p.col;
      if (r < 0 || c < 0 || r >= rows || c >= cols) return undefined;
      const cell = r * cols + c;
      const ch = entry.word[i]!;
      if (solution[cell] != null && solution[cell] !== ch) return undefined;
      solution[cell] = ch;
      cells.push(cell);
    }
    raw.push({ direction: p.direction, entry, cells });
  }

  // Standard numbering: a cell is numbered if any slot starts there, in reading order.
  const starts = new Set(raw.map((s) => s.cells[0]!));
  const numberOf = new Map<number, number>();
  [...starts].sort((a, b) => a - b).forEach((cell, i) => numberOf.set(cell, i + 1));

  const order = (d: Direction) => (d === 'across' ? 0 : 1);
  const slots = raw
    .map((s) => ({ ...s, number: numberOf.get(s.cells[0]!)! }))
    .sort((a, b) => order(a.direction) - order(b.direction) || a.number - b.number)
    .map((s, index) => ({ index, number: s.number, direction: s.direction, entry: s.entry, cells: s.cells }));

  return { spec, slots, solution };
}

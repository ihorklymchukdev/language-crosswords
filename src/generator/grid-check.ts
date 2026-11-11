import type { Direction, Placement } from '../domain/types';

type Cell = { letter: string; across?: number; down?: number };

function step(direction: Direction): [number, number] {
  return direction === 'across' ? [0, 1] : [1, 0];
}

/** Returns human-readable problems with a layout; an empty list means it is a valid crossword. */
export function checkLayout(
  placements: Placement[],
  words: Map<string, string>,
  rows: number,
  cols: number,
): string[] {
  const problems: string[] = [];
  const grid: (Cell | undefined)[] = new Array<Cell | undefined>(rows * cols);
  const parent = placements.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]!]!;
    return i;
  };
  const crosses = new Array<boolean>(placements.length).fill(false);

  placements.forEach((p, index) => {
    const word = words.get(p.entryId);
    if (word === undefined) {
      problems.push(`${p.entryId}: unknown entry`);
      return;
    }
    const [dr, dc] = step(p.direction);
    for (let i = 0; i < word.length; i++) {
      const r = p.row + dr * i;
      const c = p.col + dc * i;
      const letter = word[i]!;
      if (r < 0 || c < 0 || r >= rows || c >= cols) {
        problems.push(`${p.entryId}: out of bounds at (${r},${c})`);
        continue;
      }
      const cell = grid[r * cols + c];
      if (cell === undefined) {
        grid[r * cols + c] = { letter, [p.direction]: index };
        continue;
      }
      if (cell.letter !== letter) {
        problems.push(`${p.entryId}: '${letter}' conflicts with '${cell.letter}' at (${r},${c})`);
      }
      if (cell[p.direction] !== undefined) {
        problems.push(`${p.entryId}: overlaps another ${p.direction} word at (${r},${c})`);
        continue;
      }
      cell[p.direction] = index;
      const other = p.direction === 'across' ? cell.down : cell.across;
      if (other !== undefined) {
        crosses[index] = true;
        crosses[other] = true;
        parent[find(index)] = find(other);
      }
    }
  });

  const at = (r: number, c: number): Cell | undefined =>
    r >= 0 && c >= 0 && r < rows && c < cols ? grid[r * cols + c] : undefined;
  const wordRuns = new Set<string>();
  for (const p of placements) {
    const word = words.get(p.entryId);
    if (word === undefined) continue;
    wordRuns.add(`${p.direction}:${p.row}:${p.col}:${word.length}`);
    const [dr, dc] = step(p.direction);
    if (at(p.row - dr, p.col - dc) !== undefined || at(p.row + dr * word.length, p.col + dc * word.length) !== undefined) {
      problems.push(`${p.entryId}: a letter touches its start or end`);
    }
  }

  // Every maximal run of 2+ letters must be exactly one placed word,
  // so letters side by side never spell an unintended word.
  for (const direction of ['across', 'down'] as const) {
    const [dr, dc] = step(direction);
    const lines = direction === 'across' ? rows : cols;
    const length = direction === 'across' ? cols : rows;
    for (let line = 0; line < lines; line++) {
      let i = 0;
      while (i < length) {
        const r0 = direction === 'across' ? line : i;
        const c0 = direction === 'across' ? i : line;
        if (at(r0, c0) === undefined) {
          i++;
          continue;
        }
        let run = 0;
        while (at(r0 + dr * run, c0 + dc * run) !== undefined) run++;
        if (run >= 2 && !wordRuns.has(`${direction}:${r0}:${c0}:${run}`)) {
          problems.push(`unintended ${direction} run of ${run} letters at (${r0},${c0})`);
        }
        i += run;
      }
    }
  }

  if (placements.length > 1) {
    placements.forEach((p, i) => {
      if (!crosses[i]) problems.push(`${p.entryId}: crosses no other word`);
    });
    const groups = new Set(placements.map((_, i) => find(i)));
    if (groups.size > 1) problems.push(`layout has ${groups.size} disconnected groups`);
  }

  return problems;
}

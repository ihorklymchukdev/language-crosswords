import type { Direction, Entry, Placement } from '../domain/types';
import type { Rng } from './rng';

export type GenerateRequest = {
  candidates: readonly Entry[];
  maxRows: number;
  maxCols: number;
  minWords: number;
  maxWords: number;
  exclude?: ReadonlySet<string>;
  rng: Rng;
  attempts?: number;
};

export type RejectReason = 'pool-exhausted' | 'theme-too-narrow' | 'quality-gate-failed';

export type GenerateResult =
  | { ok: true; rows: number; cols: number; placements: Placement[]; score: number }
  | { ok: false; reason: RejectReason };

const DEFAULT_ATTEMPTS = 40;
const SEED_MIN_LENGTH = 5;
const SEED_MAX_LENGTH = 7;

type Candidate = { id: string; word: string; reviewed: boolean };
type Layout = { rows: number; cols: number; placements: Placement[]; score: number };

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

function reviewedFirst(items: Candidate[], rng: Rng): Candidate[] {
  const shuffled = shuffle([...items], rng);
  return [...shuffled.filter((c) => c.reviewed), ...shuffled.filter((c) => !c.reviewed)];
}

function usableCandidates(req: GenerateRequest): Candidate[] {
  const maxLength = Math.max(req.maxRows, req.maxCols);
  const usable = req.candidates
    .filter(
      (e) =>
        e.status !== 'do-not-use' &&
        !req.exclude?.has(e.id) &&
        e.word.length >= 2 &&
        e.word.length <= maxLength &&
        !/\s/.test(e.word),
    )
    .map((e) => ({ id: e.id, word: e.word, reviewed: e.status === 'human-reviewed' }));
  const seen = new Set<string>();
  return reviewedFirst(usable, req.rng).filter((c) => {
    if (seen.has(c.word)) return false;
    seen.add(c.word);
    return true;
  });
}

class Board {
  private readonly letters: (string | undefined)[];
  private readonly across: boolean[];
  private readonly down: boolean[];
  private readonly wordCells: number[][] = [];
  readonly placed: { candidate: Candidate; row: number; col: number; direction: Direction }[] = [];
  private minRow = Infinity;
  private maxRow = -Infinity;
  private minCol = Infinity;
  private maxCol = -Infinity;

  constructor(
    readonly height: number,
    readonly width: number,
    private readonly maxRows: number,
    private readonly maxCols: number,
  ) {
    this.letters = new Array<string | undefined>(height * width);
    this.across = new Array<boolean>(height * width).fill(false);
    this.down = new Array<boolean>(height * width).fill(false);
  }

  private letterAt(r: number, c: number): string | undefined {
    if (r < 0 || c < 0 || r >= this.height || c >= this.width) return undefined;
    return this.letters[r * this.width + c];
  }

  /** Crossings the word would make at this spot, or -1 if it cannot go there. */
  crossingsAt(word: string, row: number, col: number, direction: Direction): number {
    const dr = direction === 'down' ? 1 : 0;
    const dc = 1 - dr;
    const len = word.length;
    const endRow = row + dr * (len - 1);
    const endCol = col + dc * (len - 1);
    if (row < 0 || col < 0 || endRow >= this.height || endCol >= this.width) return -1;
    // Ternaries instead of Math.min/max: global lookups in this hot path are ~7x slower under Jest's vm.
    const top = row < this.minRow ? row : this.minRow;
    const bottom = endRow > this.maxRow ? endRow : this.maxRow;
    const left = col < this.minCol ? col : this.minCol;
    const right = endCol > this.maxCol ? endCol : this.maxCol;
    if (bottom - top + 1 > this.maxRows || right - left + 1 > this.maxCols) return -1;
    if (this.letterAt(row - dr, col - dc) !== undefined) return -1;
    if (this.letterAt(endRow + dr, endCol + dc) !== undefined) return -1;

    const sameDirection = direction === 'across' ? this.across : this.down;
    let crossings = 0;
    for (let i = 0; i < len; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const existing = this.letters[r * this.width + c];
      if (existing !== undefined) {
        if (existing !== word[i] || sameDirection[r * this.width + c]) return -1;
        crossings++;
      } else if (this.letterAt(r + dc, c + dr) !== undefined || this.letterAt(r - dc, c - dr) !== undefined) {
        return -1;
      }
    }
    return crossings;
  }

  place(candidate: Candidate, row: number, col: number, direction: Direction): void {
    const dr = direction === 'down' ? 1 : 0;
    const dc = 1 - dr;
    const flags = direction === 'across' ? this.across : this.down;
    const cells: number[] = [];
    for (let i = 0; i < candidate.word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const idx = r * this.width + c;
      this.letters[idx] = candidate.word[i];
      flags[idx] = true;
      cells.push(idx);
    }
    this.wordCells.push(cells);
    this.minRow = Math.min(this.minRow, row);
    this.minCol = Math.min(this.minCol, col);
    this.maxRow = Math.max(this.maxRow, row + dr * (candidate.word.length - 1));
    this.maxCol = Math.max(this.maxCol, col + dc * (candidate.word.length - 1));
    this.placed.push({ candidate, row, col, direction });
  }

  /**
   * The spot crossing the most placed words, or undefined if the word fits nowhere.
   * Only spots crossing words placed at index >= fromWord are considered.
   */
  bestSpot(word: string, fromWord: number): { row: number; col: number; direction: Direction } | undefined {
    let best: { row: number; col: number; direction: Direction } | undefined;
    let bestCrossings = 0;
    for (let w = fromWord; w < this.wordCells.length; w++) {
      const cells = this.wordCells[w]!;
      for (let k = 0; k < cells.length; k++) {
        const idx = cells[k]!;
        // Cells already crossed hold both directions and cannot take a third word.
        if (this.across[idx] && this.down[idx]) continue;
        const direction: Direction = this.across[idx] ? 'down' : 'across';
        const letter = this.letters[idx];
        const c = idx % this.width;
        const r = (idx - c) / this.width;
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== letter) continue;
          const row = direction === 'down' ? r - i : r;
          const col = direction === 'across' ? c - i : c;
          const crossings = this.crossingsAt(word, row, col, direction);
          if (crossings > bestCrossings) {
            bestCrossings = crossings;
            best = { row, col, direction };
          }
        }
      }
    }
    return best;
  }

  toLayout(): Layout {
    let filled = 0;
    let crossings = 0;
    for (let idx = 0; idx < this.letters.length; idx++) {
      if (this.letters[idx] !== undefined) filled++;
      if (this.across[idx] && this.down[idx]) crossings++;
    }
    const rows = this.maxRow - this.minRow + 1;
    const cols = this.maxCol - this.minCol + 1;
    return {
      rows,
      cols,
      placements: this.placed.map((p) => ({
        entryId: p.candidate.id,
        row: p.row - this.minRow,
        col: p.col - this.minCol,
        direction: p.direction,
      })),
      score: crossings * 3 + this.placed.length * 2 - (rows * cols - filled) * 0.3,
    };
  }
}

function pickSeed(order: Candidate[], req: GenerateRequest, rng: Rng): { seed: Candidate; direction: Direction } | undefined {
  const fits = (c: Candidate, d: Direction): boolean => c.word.length <= (d === 'across' ? req.maxCols : req.maxRows);
  const preferred: Direction = rng() < 0.5 ? 'across' : 'down';
  const other: Direction = preferred === 'across' ? 'down' : 'across';
  const midLength = (c: Candidate): boolean => c.word.length >= SEED_MIN_LENGTH && c.word.length <= SEED_MAX_LENGTH;
  for (const direction of [preferred, other]) {
    const seed = order.find((c) => midLength(c) && fits(c, direction));
    if (seed) return { seed, direction };
  }
  // Tiny pools may lack mid-length words; fall back to the longest word that fits.
  let fallback: { seed: Candidate; direction: Direction } | undefined;
  for (const c of order) {
    const direction = fits(c, preferred) ? preferred : fits(c, other) ? other : undefined;
    if (direction && (!fallback || c.word.length > fallback.seed.word.length)) fallback = { seed: c, direction };
  }
  return fallback;
}

function runAttempt(pool: Candidate[], req: GenerateRequest): Layout | undefined {
  const order = reviewedFirst(pool, req.rng);
  const start = pickSeed(order, req, req.rng);
  if (!start) return undefined;

  const board = new Board(req.maxRows * 2, req.maxCols * 2, req.maxRows, req.maxCols);
  const { seed, direction } = start;
  const len = seed.word.length;
  board.place(
    seed,
    direction === 'down' ? req.maxRows - Math.floor(len / 2) : req.maxRows,
    direction === 'across' ? req.maxCols - Math.floor(len / 2) : req.maxCols,
    direction,
  );

  // Placing a word only removes spots elsewhere, so a candidate that did not fit
  // can only fit now by crossing a word placed after it was last checked.
  const remaining = order.filter((c) => c !== seed).map((candidate) => ({ candidate, checkedUpTo: 0 }));
  while (board.placed.length < req.maxWords) {
    let placedIndex = -1;
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i]!;
      const spot = board.bestSpot(item.candidate.word, item.checkedUpTo);
      if (spot) {
        board.place(item.candidate, spot.row, spot.col, spot.direction);
        placedIndex = i;
        break;
      }
      item.checkedUpTo = board.placed.length;
    }
    if (placedIndex < 0) break;
    remaining.splice(placedIndex, 1);
  }

  return board.placed.length >= req.minWords ? board.toLayout() : undefined;
}

export function generateLayout(req: GenerateRequest): GenerateResult {
  const pool = usableCandidates(req);
  if (pool.length < req.minWords) return { ok: false, reason: 'pool-exhausted' };

  let best: Layout | undefined;
  const attempts = req.attempts ?? DEFAULT_ATTEMPTS;
  for (let a = 0; a < attempts; a++) {
    const layout = runAttempt(pool, req);
    if (layout && (!best || layout.score > best.score)) best = layout;
  }
  if (!best) return { ok: false, reason: 'quality-gate-failed' };
  return { ok: true, ...best };
}

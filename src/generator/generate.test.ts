import type { Entry, Placement } from '../domain/types';
import { generateLayout, type GenerateRequest, type GenerateResult } from './generate';
import { checkLayout } from './grid-check';
import { seededRng } from './rng';
import { fixtureEntries, makeEntry } from './test-fixtures';

const SEEDS = Array.from({ length: 200 }, (_, i) => `seed-${i}`);
const pool300 = fixtureEntries(300);
const pool400 = fixtureEntries(400);

function request(seed: string, overrides: Partial<GenerateRequest> = {}): GenerateRequest {
  return { candidates: pool300, maxRows: 7, maxCols: 7, minWords: 5, maxWords: 15, rng: seededRng(seed), ...overrides };
}

function expectOk(result: GenerateResult): Extract<GenerateResult, { ok: true }> {
  if (!result.ok) throw new Error(`generation failed: ${result.reason}`);
  return result;
}

function wordsOf(candidates: readonly Entry[]): Map<string, string> {
  return new Map(candidates.map((e) => [e.id, e.word]));
}

describe('generateLayout', () => {
  it('is deterministic for the same seed', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      expect(generateLayout(request(seed))).toEqual(generateLayout(request(seed)));
    }
  });

  it('never conflicts at crossings and every word crosses another', () => {
    const words = wordsOf(pool300);
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed)));
      expect(result.placements.length).toBeGreaterThanOrEqual(5);
      expect(result.placements.length).toBeLessThanOrEqual(15);
      expect(checkLayout(result.placements, words, result.rows, result.cols)).toEqual([]);
    }
  });

  it.each([7, 9])('respects maxRows/maxCols %i', (max) => {
    const words = wordsOf(pool300);
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed, { maxRows: max, maxCols: max })));
      expect(result.rows).toBeLessThanOrEqual(max);
      expect(result.cols).toBeLessThanOrEqual(max);
      expect(checkLayout(result.placements, words, result.rows, result.cols)).toEqual([]);
    }
  });

  it('never uses excluded ids', () => {
    const exclude = new Set(pool300.filter((_, i) => i % 2 === 0).map((e) => e.id));
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed, { exclude })));
      for (const p of result.placements) expect(exclude.has(p.entryId)).toBe(false);
    }
  });

  it('never uses the same spelling twice', () => {
    const homographs = pool300.map((e) => makeEntry(e.word, `${e.id}-homograph`));
    const candidates = [...pool300, ...homographs];
    const words = wordsOf(candidates);
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed, { candidates })));
      const spellings = result.placements.map((p) => words.get(p.entryId));
      expect(new Set(spellings).size).toBe(spellings.length);
    }
  });

  it('returns pool-exhausted when fewer candidates than minWords', () => {
    const candidates = fixtureEntries(4);
    expect(generateLayout(request('x', { candidates }))).toEqual({ ok: false, reason: 'pool-exhausted' });
  });

  it('counts only usable candidates towards the pool', () => {
    const candidates = [
      ...fixtureEntries(3),
      makeEntry('casa', 'dup-1'),
      makeEntry('casa', 'dup-2'),
      makeEntry('dos palabras', 'spaced'),
      makeEntry('electricidad', 'too-long'),
    ];
    expect(generateLayout(request('x', { candidates }))).toEqual({ ok: false, reason: 'pool-exhausted' });
  });

  it('finishes under 500ms for 9x9 with 400 candidates', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const start = Date.now();
      generateLayout(request(seed, { candidates: pool400, maxRows: 9, maxCols: 9 }));
      expect(Date.now() - start).toBeLessThan(500);
    }
  });
});

describe('checkLayout', () => {
  const words = new Map(['casa', 'sol', 'mar', 'pan', 'año'].map((w) => [w, w]));
  // c a s a
  // . . o .
  // . . l .
  const valid: Placement[] = [
    { entryId: 'casa', row: 0, col: 0, direction: 'across' },
    { entryId: 'sol', row: 0, col: 2, direction: 'down' },
  ];
  const reports = (text: string) => expect.arrayContaining([expect.stringContaining(text)]);

  it('accepts a valid layout', () => {
    expect(checkLayout(valid, words, 3, 4)).toEqual([]);
  });

  it('flags out-of-bounds words', () => {
    expect(checkLayout(valid, words, 2, 4)).toEqual(reports('out of bounds'));
  });

  it('flags letter conflicts at a crossing', () => {
    const layout: Placement[] = [valid[0]!, { entryId: 'mar', row: 0, col: 2, direction: 'down' }];
    expect(checkLayout(layout, words, 3, 4)).toEqual(reports('conflicts'));
  });

  it('flags a word that crosses nothing', () => {
    const layout: Placement[] = [...valid, { entryId: 'pan', row: 4, col: 0, direction: 'across' }];
    expect(checkLayout(layout, words, 5, 4)).toEqual(reports('crosses no other word'));
  });

  it('flags disconnected groups even when every word crosses another', () => {
    const layout: Placement[] = [
      ...valid,
      { entryId: 'pan', row: 4, col: 0, direction: 'across' },
      { entryId: 'año', row: 4, col: 1, direction: 'down' },
    ];
    expect(checkLayout(layout, words, 7, 4)).toEqual(['layout has 2 disconnected groups']);
  });

  it('flags side-by-side letters that form unintended words', () => {
    // "sol" and "año" hang side by side from "casa": rows 1-2 read "oñ" and "lo".
    const layout: Placement[] = [...valid, { entryId: 'año', row: 0, col: 3, direction: 'down' }];
    const problems = checkLayout(layout, words, 3, 4);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((p) => p.startsWith('unintended across run'))).toBe(true);
  });

  it('flags a word whose end runs into another letter', () => {
    // "pan" starts right after the "l" of "sol", so row 2 reads "lpan".
    const layout: Placement[] = [...valid, { entryId: 'pan', row: 2, col: 3, direction: 'across' }];
    expect(checkLayout(layout, words, 3, 6)).toEqual(reports('touches its start or end'));
  });

  it('never places two answers sharing a 4-letter stem', () => {
    const stemmed = [...['freno', 'frenar'].map((w) => makeEntry(w)), ...pool300.slice(0, 120)];
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed, { candidates: stemmed })));
      const words = result.placements.map((p) => stemmed.find((e) => e.id === p.entryId)!.word);
      const stems = words.filter((w) => w.length >= 4).map((w) => w.slice(0, 4));
      expect(new Set(stems).size).toBe(stems.length);
    }
  });

  it('never places an answer that appears in another clue', () => {
    const base = pool300.slice(0, 120);
    const withClues = base.map((e, i) => ({ ...e, clue: `Se parece a ${base[(i + 1) % base.length]!.word}` }));
    for (const seed of SEEDS) {
      const result = expectOk(generateLayout(request(seed, { candidates: withClues })));
      const placed = result.placements.map((p) => withClues.find((e) => e.id === p.entryId)!);
      for (const a of placed) for (const b of placed) expect(a.clue.endsWith(` ${b.word}`)).toBe(false);
    }
  });
});

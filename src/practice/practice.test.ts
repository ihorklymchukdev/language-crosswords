import { getEntries, getEntry, themesForLevel } from '../catalogue/catalogue';
import { LEVELS } from '../domain/levels';
import type { PuzzleSpec } from '../domain/types';
import { checkLayout } from '../generator/grid-check';
import { makePracticeSpec } from './practice';

function expectSpec(result: ReturnType<typeof makePracticeSpec>): PuzzleSpec {
  if ('reason' in result) throw new Error(`practice failed: ${result.reason}`);
  return result;
}

function problems(spec: PuzzleSpec): string[] {
  const words = new Map(spec.placements.map((p) => [p.entryId, getEntry(p.entryId)?.word ?? '']));
  return checkLayout(spec.placements, words, spec.rows, spec.cols);
}

describe('makePracticeSpec', () => {
  it.each(LEVELS)('builds a valid 20+ word grid from the %s catalogue', (level) => {
    for (const seed of ['a', 'b', 'c']) {
      const spec = expectSpec(makePracticeSpec(level, undefined, [], seed));
      expect(spec.placements.length).toBeGreaterThanOrEqual(20);
      expect(problems(spec)).toEqual([]);
    }
  });

  it.each(LEVELS)('builds a puzzle for every theme the %s Practice tab offers', (level) => {
    for (const theme of themesForLevel(level, 12)) {
      const spec = expectSpec(makePracticeSpec(level, theme.id, [], `theme-${theme.id}`));
      expect(problems(spec)).toEqual([]);
    }
  });

  it('avoids words from recent puzzles when the pool allows', () => {
    const first = expectSpec(makePracticeSpec('A2', undefined, [], 'first'));
    const recent = [first.placements.map((p) => p.entryId)];
    const next = expectSpec(makePracticeSpec('A2', undefined, recent, 'next'));
    const used = new Set(recent[0]);
    expect(next.placements.filter((p) => used.has(p.entryId))).toEqual([]);
  });

  it('drops older puzzles first when avoiding all recent words is impossible', () => {
    const ids = getEntries('B2').map((e) => e.id);
    const latest = [ids.slice(0, 30), ids.slice(30, 60), ids.slice(60, 90)];
    const recent = [ids, ...latest];
    const spec = expectSpec(makePracticeSpec('B2', undefined, recent, 'exhausted'));
    const avoided = new Set(latest.flat());
    expect(spec.placements.filter((p) => avoided.has(p.entryId))).toEqual([]);
  });

  it('repeats words rather than fail when even the latest puzzles cover the pool', () => {
    const ids = getEntries('B2').map((e) => e.id);
    const spec = expectSpec(makePracticeSpec('B2', undefined, [ids], 'everything'));
    expect(spec.placements.length).toBeGreaterThanOrEqual(20);
  });
});

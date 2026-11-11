import { LEVELS, type Level } from '../domain/levels';
import type { Entry, Theme } from '../domain/types';
import a2 from '../../data/catalogue/es/A2.json';
import b1 from '../../data/catalogue/es/B1.json';
import b2 from '../../data/catalogue/es/B2.json';
import version from '../../data/catalogue/es/version.json';
import themesJson from '../../data/themes.json';

const ENTRIES_BY_LEVEL: Record<Level, readonly Entry[]> = {
  A2: a2 as Entry[],
  B1: b1 as Entry[],
  B2: b2 as Entry[],
};

const BY_ID: ReadonlyMap<string, Entry> = new Map(
  LEVELS.flatMap((level) => ENTRIES_BY_LEVEL[level]).map((e) => [e.id, e]),
);

export const CATALOGUE_VERSION: string = version.version;

export function getEntries(level: Level): readonly Entry[] {
  return ENTRIES_BY_LEVEL[level].filter((e) => e.status !== 'do-not-use');
}

// Includes do-not-use so previously generated dailies can still resolve.
export function getEntry(id: string): Entry | undefined {
  return BY_ID.get(id);
}

export function getThemes(): readonly Theme[] {
  return themesJson as Theme[];
}

export function themesForLevel(level: Level, minWords: number): readonly Theme[] {
  const entries = getEntries(level);
  return getThemes().filter((t) => entries.filter((e) => e.themes.includes(t.id)).length >= minWords);
}

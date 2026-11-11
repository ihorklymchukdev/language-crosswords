import type { Level } from './levels';

export type Region = 'neutral' | 'es-ES' | 'es-MX' | 'es-419';
export type EntryStatus = 'auto-only' | 'human-reviewed' | 'do-not-use';

export type Entry = {
  id: string;
  language: 'es';
  word: string;
  pos: string;
  level: Level;
  region: Region;
  themes: string[];
  clue: string;
  clueEn: string;
  translationEn: string;
  status: EntryStatus;
};

export type Theme = { id: string; nameEn: string; nameEs: string };

export type Direction = 'across' | 'down';
export type Placement = { entryId: string; row: number; col: number; direction: Direction };
export type PuzzleKind = 'daily' | 'practice';

export type PuzzleSpec = {
  id: string;
  kind: PuzzleKind;
  level: Level;
  rows: number;
  cols: number;
  placements: Placement[];
  date?: string;
  themeId?: string;
};

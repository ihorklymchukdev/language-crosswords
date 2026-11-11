import { LEVELS } from '../domain/levels';
import type { Entry, EntryStatus, Region, Theme } from '../domain/types';
import { normalizeBase } from './normalize';
import { isProfane } from './profanity';

export { normalizeBase };

export type ValidationIssue = { entryId: string; problem: string };

const ANSWER_PATTERN = /^[a-zñáéíóúü]{3,}$/;
const REGIONS: readonly Region[] = ['neutral', 'es-ES', 'es-MX', 'es-419'];
const STATUSES: readonly EntryStatus[] = ['auto-only', 'human-reviewed', 'do-not-use'];

const MARKERS: Record<Exclude<Region, 'neutral'>, { es: string; en: string }> = {
  'es-ES': { es: ' (España)', en: ' (Spain)' },
  'es-MX': { es: ' (México)', en: ' (Mexico)' },
  'es-419': { es: ' (América Latina)', en: ' (Latin America)' },
};
const ALL_MARKERS = Object.values(MARKERS);

export function validateCatalogue(entries: Entry[], themes: Theme[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const themeIds = new Set(themes.map((t) => t.id));
  const seenIds = new Set<string>();
  const levelsByWord = new Map<string, Set<string>>();

  for (const e of entries) {
    const add = (problem: string) => issues.push({ entryId: e.id, problem });

    if (seenIds.has(e.id)) add('duplicate id');
    seenIds.add(e.id);

    if (!(LEVELS as readonly string[]).includes(e.level)) add(`invalid level "${e.level}"`);
    if (!REGIONS.includes(e.region)) add(`invalid region "${e.region}"`);
    if (!STATUSES.includes(e.status)) add(`invalid status "${e.status}"`);
    if (e.language !== 'es') add(`invalid language "${e.language}"`);

    if (!ANSWER_PATTERN.test(e.word)) add(`invalid answer "${e.word}" (lowercase a-z ñ áéíóúü, single word, 3+ letters)`);
    if (isProfane(e.word)) add(`profanity: "${e.word}"`);

    const levels = levelsByWord.get(e.word) ?? new Set<string>();
    levels.add(e.level);
    levelsByWord.set(e.word, levels);

    for (const t of e.themes) if (!themeIds.has(t)) add(`unknown theme id "${t}"`);

    if (e.clue.length < 3 || e.clue.length > 140) add(`clue length ${e.clue.length} outside 3-140`);
    if (!e.clueEn.trim()) add('empty clueEn');
    if (!e.translationEn.trim()) add('empty translationEn');

    const stem = e.word.length >= 5 ? e.word.slice(0, -2) : e.word;
    if (stem && normalizeBase(e.clue).includes(normalizeBase(stem))) add('clue contains the answer');

    if (e.region === 'neutral') {
      if (ALL_MARKERS.some((m) => e.clue.endsWith(m.es) || e.clueEn.endsWith(m.en))) {
        add('regional marker present on neutral entry');
      }
    } else if (e.region in MARKERS) {
      const m = MARKERS[e.region as Exclude<Region, 'neutral'>];
      if (!e.clue.endsWith(m.es)) add(`regional marker missing: clue must end with "${m.es}"`);
      if (!e.clueEn.endsWith(m.en)) add(`regional marker missing: clueEn must end with "${m.en}"`);
    }
  }

  for (const [word, levels] of levelsByWord) {
    if (levels.size > 1) {
      issues.push({ entryId: word, problem: `word present in two levels: ${[...levels].join(', ')}` });
    }
  }
  return issues;
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkLayout } from '../src/generator/grid-check';
import type { DailySchedule } from '../src/daily/daily';
import { LEVELS } from '../src/domain/levels';
import type { Entry, Theme } from '../src/domain/types';
import { validateCatalogue } from '../src/catalogue/validate';

const root = join(__dirname, '..', 'data');
const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T;

const themes = read<Theme[]>('themes.json');
const entries = LEVELS.flatMap((level) => read<Entry[]>(`catalogue/es/${level}.json`));
const issues = validateCatalogue(entries, themes);

for (const level of LEVELS) {
  const file = read<Entry[]>(`catalogue/es/${level}.json`);
  for (const e of file) {
    if (e.level !== level) issues.push({ entryId: e.id, problem: `level "${e.level}" in ${level}.json` });
    if (!e.id.startsWith(`es-${level}-`)) issues.push({ entryId: e.id, problem: `id prefix does not match ${level}` });
  }
  const words = new Map(file.map((e) => [e.id, e.word]));
  const schedule = read<DailySchedule>(`daily/es/${level}.json`);
  for (const [date, day] of Object.entries(schedule.days)) {
    for (const problem of checkLayout(day.placements, words, day.rows, day.cols)) {
      issues.push({ entryId: `daily ${level} ${date}`, problem });
    }
  }
}

if (issues.length > 0) {
  for (const i of issues) console.error(`${i.entryId}: ${i.problem}`);
  process.exit(1);
}
console.log(`Catalogue OK: ${entries.length} entries, ${themes.length} themes, ${LEVELS.length} levels`);

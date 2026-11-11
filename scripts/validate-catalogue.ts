import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LEVELS } from '../src/domain/levels';
import type { Entry, Theme } from '../src/domain/types';
import { validateCatalogue } from '../src/catalogue/validate';

const root = join(__dirname, '..', 'data');
const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), 'utf8')) as T;

const themes = read<Theme[]>('themes.json');
const entries = LEVELS.flatMap((level) => read<Entry[]>(`catalogue/es/${level}.json`));
const issues = validateCatalogue(entries, themes);

if (issues.length > 0) {
  for (const i of issues) console.error(`${i.entryId}: ${i.problem}`);
  process.exit(1);
}
console.log(`Catalogue OK: ${entries.length} entries, ${themes.length} themes, ${LEVELS.length} levels`);

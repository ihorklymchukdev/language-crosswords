import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getEntries } from '../src/catalogue/catalogue';
import { addDays } from '../src/daily/dates';
import { dailySeed, generateDailyLayout } from '../src/daily/daily-layout';
import type { DailySchedule } from '../src/daily/daily';
import { LEVELS } from '../src/domain/levels';

const ANTI_REPEAT_DAYS = 7;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const from = arg('from');
const days = Number(arg('days'));
if (!from || !DATE_RE.test(from) || !Number.isInteger(days) || days < 1) {
  console.error('Usage: daily:build --from YYYY-MM-DD --days N');
  process.exit(1);
}

for (const level of LEVELS) {
  const file = join(__dirname, '..', 'data', 'daily', 'es', `${level}.json`);
  const schedule: DailySchedule = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as DailySchedule)
    : { version: 1, days: {} };
  const candidates = getEntries(level);
  let added = 0;
  const failed: string[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (schedule.days[date]) continue;
    const exclude = new Set<string>();
    for (let k = 1; k <= ANTI_REPEAT_DAYS; k++) {
      for (const p of schedule.days[addDays(date, -k)]?.placements ?? []) exclude.add(p.entryId);
    }
    const layout = generateDailyLayout(dailySeed(date, level), candidates, exclude);
    if (layout) {
      schedule.days[date] = layout;
      added++;
    } else {
      failed.push(date);
    }
  }

  // Sorted keys keep diffs append-only; existing entries are never modified.
  const sorted = Object.fromEntries(Object.entries(schedule.days).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, `${JSON.stringify({ version: 1, days: sorted }, null, 1)}\n`);
  console.log(`${level}: +${added} added, ${failed.length} failed${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

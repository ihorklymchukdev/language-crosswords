import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getEntries } from '../src/catalogue/catalogue';
import { addDays } from '../src/daily/dates';
import { dailySeed, generateDailyLayout } from '../src/daily/daily-layout';
import type { DailySchedule } from '../src/daily/daily';
import { checkLayout } from '../src/generator/grid-check';
import { LEVELS } from '../src/domain/levels';

// Prefer a long window; 7 days is the required minimum.
const ANTI_REPEAT_WINDOWS = [30, 14, 7];
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
  const words = new Map(candidates.map((e) => [e.id, e.word]));
  const existing = Object.keys(schedule.days);
  // Only extend past the last scheduled date; interior gaps are failed days and stay empty.
  const last = existing.length > 0 ? existing.reduce((a, b) => (a > b ? a : b)) : undefined;
  let added = 0;
  const failed: string[] = [];
  const fallbacks: Record<number, number> = {};

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    if (last !== undefined && date <= last) continue;
    let layout: ReturnType<typeof generateDailyLayout> | undefined;
    let problems: string[] = [];
    for (const window of ANTI_REPEAT_WINDOWS) {
      const exclude = new Set<string>();
      for (let k = 1; k <= window; k++) {
        for (const p of schedule.days[addDays(date, -k)]?.placements ?? []) exclude.add(p.entryId);
      }
      layout = generateDailyLayout(dailySeed(date, level), candidates, exclude);
      problems = layout ? checkLayout(layout.placements, words, layout.rows, layout.cols) : ['no layout'];
      if (layout && problems.length === 0) {
        if (window !== ANTI_REPEAT_WINDOWS[0]) {
          console.log(`${level} ${date}: fell back to ${window}-day window`);
          fallbacks[window] = (fallbacks[window] ?? 0) + 1;
        }
        break;
      }
    }
    if (layout && problems.length > 0 && problems[0] !== 'no layout') console.error(`${level} ${date}: ${problems.join('; ')}`);
    if (layout && problems.length === 0) {
      schedule.days[date] = layout;
      added++;
    } else {
      failed.push(date);
    }
  }

  // Sorted keys keep diffs append-only; existing entries are never modified.
  const sorted = Object.fromEntries(Object.entries(schedule.days).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(file, `${JSON.stringify({ version: 1, days: sorted }, null, 1)}\n`);
  console.log(`${level} fallbacks: ${JSON.stringify(fallbacks)}`);
  console.log(`${level}: +${added} added, ${failed.length} failed${failed.length ? ` (${failed.join(', ')})` : ''}`);
}

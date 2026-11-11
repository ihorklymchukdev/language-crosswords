import { addDays, localDateKey } from '../src/daily/dates';
import { getDailySpec } from '../src/daily/daily';
import { LEVELS } from '../src/domain/levels';
import { resolvePuzzle } from '../src/play/puzzle';

const i = process.argv.indexOf('--days');
const days = i >= 0 ? Number(process.argv[i + 1]) : 14;
const today = localDateKey();

for (let d = 0; d < days; d++) {
  const date = addDays(today, d);
  for (const level of LEVELS) {
    const spec = getDailySpec(date, level);
    const puzzle = spec && resolvePuzzle(spec);
    console.log(`\n${date}  ${level}`);
    if (!puzzle) {
      console.log('  (no puzzle)');
      continue;
    }
    for (let r = 0; r < spec.rows; r++) {
      const row = puzzle.solution.slice(r * spec.cols, (r + 1) * spec.cols);
      console.log(`  ${row.map((c) => (c ?? '#').toUpperCase()).join(' ')}`);
    }
    for (const s of puzzle.slots) {
      console.log(`  ${s.number}${s.direction === 'across' ? 'A' : 'D'}. ${s.entry.clue}`);
    }
  }
}

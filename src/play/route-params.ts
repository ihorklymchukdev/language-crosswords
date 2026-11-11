import { localDateKey } from '../daily/dates';
import { LEVELS, type Level } from '../domain/levels';

type Param = string | string[] | undefined;

const single = (v: Param): string | undefined => (Array.isArray(v) ? v[0] : v);

export function parseLevel(v: Param): Level | undefined {
  const s = single(v);
  return LEVELS.find((l) => l === s);
}

// A real calendar date no later than today; future dailies stay closed.
export function parseDateKey(v: Param, today: string = localDateKey()): string | undefined {
  const s = single(v);
  if (s === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (localDateKey(new Date(y!, m! - 1, d!)) !== s) return undefined;
  return s <= today ? s : undefined;
}

export function parseString(v: Param): string | undefined {
  const s = single(v);
  return s === undefined || s === '' ? undefined : s;
}

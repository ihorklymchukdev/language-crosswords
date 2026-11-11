import { normalizeBase } from '../catalogue/normalize';

// normalizeBase keeps ñ, so ñ never matches n; accented vowels and ü match their base letter.
export function lettersMatch(typed: string, answer: string): boolean {
  const t = typed.toLowerCase();
  const a = answer.toLowerCase();
  return t === a || normalizeBase(t) === normalizeBase(a);
}

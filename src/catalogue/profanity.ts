import { normalizeBase } from './normalize';

const BLOCKLIST: ReadonlySet<string> = new Set([
  'puta', 'puto', 'mierda', 'coño', 'joder', 'cabron', 'cabrona', 'pendejo', 'pendeja',
  'culo', 'verga', 'polla', 'pene', 'vagina', 'follar', 'chingar', 'maricon', 'gilipollas', 'zorra',
]);

export function isProfane(word: string): boolean {
  return BLOCKLIST.has(normalizeBase(word));
}

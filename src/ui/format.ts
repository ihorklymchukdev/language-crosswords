const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTime(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatDayMonth(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1] ?? ''}`;
}

export const upper = (s: string) => s.toLocaleUpperCase('es');

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

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parts(dateKey: string): { weekday: number; day: number; month: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return { weekday: date.getDay(), day: date.getDate(), month: date.getMonth() };
}

// "Tuesday, 11 November"
export function formatLongDate(dateKey: string): string {
  const { weekday, day, month } = parts(dateKey);
  return `${WEEKDAYS[weekday] ?? ''}, ${day} ${MONTHS_LONG[month] ?? ''}`;
}

// "Mon 10 Nov"
export function formatShortDate(dateKey: string): string {
  const { weekday, day, month } = parts(dateKey);
  return `${(WEEKDAYS[weekday] ?? '').slice(0, 3)} ${day} ${MONTHS[month] ?? ''}`;
}

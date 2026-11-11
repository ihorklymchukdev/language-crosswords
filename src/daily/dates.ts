const pad = (n: number) => String(n).padStart(2, '0');

export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Date(y, m, d + n) normalises overflow in local time, so DST shifts can't skip or repeat a day.
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return localDateKey(new Date(y!, m! - 1, d! + n));
}

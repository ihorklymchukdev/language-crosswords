import { parseDateKey, parseLevel } from './route-params';

describe('route params', () => {
  it('accepts only known levels', () => {
    expect(parseLevel('B1')).toBe('B1');
    expect(parseLevel('b1')).toBeUndefined();
    expect(parseLevel(['A2'])).toBe('A2');
  });

  it('rejects dates that do not exist on the calendar', () => {
    expect(parseDateKey('2026-02-29', '2026-11-11')).toBeUndefined();
    expect(parseDateKey('2026-13-01', '2026-11-11')).toBeUndefined();
    expect(parseDateKey('2026-1-05', '2026-11-11')).toBeUndefined();
  });

  it('opens today and past dates but not future ones', () => {
    expect(parseDateKey('2026-11-11', '2026-11-11')).toBe('2026-11-11');
    expect(parseDateKey('2024-02-29', '2026-11-11')).toBe('2024-02-29');
    expect(parseDateKey('2026-11-12', '2026-11-11')).toBeUndefined();
  });
});

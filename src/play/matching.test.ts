import { lettersMatch } from './matching';

describe('lettersMatch', () => {
  it('treats a base vowel and its accented form as equal in both directions', () => {
    expect(lettersMatch('a', 'á')).toBe(true);
    expect(lettersMatch('á', 'a')).toBe(true);
    expect(lettersMatch('u', 'ü')).toBe(true);
  });

  it('does not treat n and ñ as equal', () => {
    expect(lettersMatch('n', 'ñ')).toBe(false);
    expect(lettersMatch('ñ', 'n')).toBe(false);
    expect(lettersMatch('Ñ', 'ñ')).toBe(true);
  });
});

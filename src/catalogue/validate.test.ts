import type { Entry, Theme } from '../domain/types';
import { normalizeBase, validateCatalogue } from './validate';

const themes: Theme[] = [
  { id: 'food', nameEn: 'Food', nameEs: 'Comida' },
  { id: 'animals', nameEn: 'Animals', nameEs: 'Animales' },
];

function entry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'es-A2-perro',
    language: 'es',
    word: 'perro',
    pos: 'noun',
    level: 'A2',
    region: 'neutral',
    themes: ['animals'],
    clue: 'Animal que ladra',
    clueEn: 'Animal that barks',
    translationEn: 'dog',
    status: 'auto-only',
    ...overrides,
  };
}

const problems = (entries: Entry[]) => validateCatalogue(entries, themes).map((i) => i.problem);

describe('validateCatalogue', () => {
  it('accepts a valid entry', () => {
    expect(validateCatalogue([entry()], themes)).toEqual([]);
  });

  it('flags duplicate ids', () => {
    const issues = validateCatalogue([entry(), entry({ word: 'gato' })], themes);
    expect(issues.some((i) => /duplicate id/i.test(i.problem))).toBe(true);
  });

  it('flags a word present in two levels', () => {
    const issues = validateCatalogue([entry(), entry({ id: 'es-B1-perro', level: 'B1' })], themes);
    expect(issues.some((i) => /two levels|multiple levels/i.test(i.problem))).toBe(true);
  });

  it('flags clue containing the answer ignoring accents', () => {
    const e = entry({ id: 'es-A2-canción', word: 'canción', clue: 'Una cancion bonita' });
    expect(problems([e]).some((p) => /clue.*answer/i.test(p))).toBe(true);
  });

  it('only checks the stem of long answers, so inflected hints pass', () => {
    const e = entry({ word: 'comida', clue: 'Lo que se come' });
    expect(problems([e])).toEqual([]);
  });

  it('flags clue over 140 chars', () => {
    expect(problems([entry({ clue: 'x'.repeat(141) })]).some((p) => /clue length/i.test(p))).toBe(true);
  });

  it('flags clue under 3 chars', () => {
    expect(problems([entry({ clue: 'ab' })]).some((p) => /clue length/i.test(p))).toBe(true);
  });

  it.each(['dos palabras', 'abc1', 'ab'])('flags invalid answer %s', (word) => {
    const e = entry({ id: `es-A2-${word}`, word });
    expect(problems([e]).some((p) => /answer/i.test(p))).toBe(true);
  });

  it('flags unknown theme id', () => {
    expect(problems([entry({ themes: ['nope'] })]).some((p) => /theme/i.test(p))).toBe(true);
  });

  it('flags profanity', () => {
    const e = entry({ id: 'es-A2-puta', word: 'puta', clue: 'Insulto grave' });
    expect(problems([e]).some((p) => /profan/i.test(p))).toBe(true);
  });

  it('flags invalid level, region, status and language', () => {
    const bad = entry() as unknown as Record<string, unknown>;
    const e = { ...bad, level: 'C1', region: 'es-AR', status: 'maybe', language: 'fr' } as unknown as Entry;
    const p = problems([e]);
    expect(p.some((x) => /level/i.test(x))).toBe(true);
    expect(p.some((x) => /region/i.test(x))).toBe(true);
    expect(p.some((x) => /status/i.test(x))).toBe(true);
    expect(p.some((x) => /language/i.test(x))).toBe(true);
  });

  it('flags empty clueEn and translationEn', () => {
    const p = problems([entry({ clueEn: '', translationEn: ' ' })]);
    expect(p.some((x) => /clueEn/.test(x))).toBe(true);
    expect(p.some((x) => /translationEn/.test(x))).toBe(true);
  });

  it('requires regional markers when region is not neutral', () => {
    expect(problems([entry({ region: 'es-ES' })]).some((p) => /marker/i.test(p))).toBe(true);
    const ok = entry({ region: 'es-MX', clue: 'Animal que ladra (México)', clueEn: 'Animal that barks (Mexico)' });
    expect(problems([ok])).toEqual([]);
    const ok419 = entry({
      region: 'es-419',
      clue: 'Animal que ladra (América Latina)',
      clueEn: 'Animal that barks (Latin America)',
    });
    expect(problems([ok419])).toEqual([]);
  });

  it('flags a regional marker on a neutral entry', () => {
    const e = entry({ clue: 'Animal que ladra (España)' });
    expect(problems([e]).some((p) => /marker/i.test(p))).toBe(true);
  });
});

describe('normalizeBase', () => {
  it('strips acute accents and diaeresis but keeps ñ', () => {
    expect(normalizeBase('CANCIÓN')).toBe('cancion');
    expect(normalizeBase('pingüino')).toBe('pinguino');
    expect(normalizeBase('año')).toBe('año');
  });
});

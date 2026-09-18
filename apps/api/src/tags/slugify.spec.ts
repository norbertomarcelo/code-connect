import { slugify } from './slugify.js';

describe('slugify', () => {
  it('lowercases, strips accents and hyphenates', () => {
    expect(slugify('Acessibilidade Web')).toBe('acessibilidade-web');
    expect(slugify('Ação')).toBe('acao');
  });

  it('collapses separators and trims hyphens', () => {
    expect(slugify('  Front--end!! ')).toBe('front-end');
  });

  it('returns an empty string when nothing is left', () => {
    expect(slugify('!!!')).toBe('');
  });
});

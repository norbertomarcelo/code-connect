import { toHandle } from './handle.js';

describe('toHandle', () => {
  it('uses the lowercased email local part', () => {
    expect(toHandle('Julio@codeconnect.dev')).toBe('julio');
  });

  it('drops characters that do not belong in a handle', () => {
    expect(toHandle('ju+lio!@x.dev')).toBe('julio');
  });

  it('falls back when nothing is left', () => {
    expect(toHandle('+++@x.dev')).toBe('usuario');
  });
});

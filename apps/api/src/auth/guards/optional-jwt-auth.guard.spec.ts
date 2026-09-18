import type { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';

describe('OptionalJwtAuthGuard', () => {
  const guard = new OptionalJwtAuthGuard();
  const context = {} as ExecutionContext;
  const user = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' };

  it('returns the user when authentication succeeded', () => {
    expect(guard.handleRequest(null, user, undefined, context)).toBe(user);
  });

  it('returns undefined instead of throwing when authentication failed', () => {
    expect(
      guard.handleRequest(null, false, undefined, context),
    ).toBeUndefined();
  });

  it('rethrows a strategy error', () => {
    const boom = new Error('boom');

    expect(() => guard.handleRequest(boom, false, undefined, context)).toThrow(
      boom,
    );
  });
});

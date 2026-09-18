import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

/**
 * Returns `undefined` when no guard populated `request.user`. TypeScript does
 * not check the parameter annotation against this: behind `JwtAuthGuard` the
 * handler may annotate `AuthenticatedUser`, behind `OptionalJwtAuthGuard` it
 * must annotate `AuthenticatedUser | undefined`. The guard is what guarantees
 * it, not the compiler.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);

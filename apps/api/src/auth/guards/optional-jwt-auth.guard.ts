import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

/**
 * Lets every request through. A valid `Authorization: Bearer` fills
 * `request.user`; a missing, malformed or expired token leaves it `undefined`
 * instead of raising 401, so a public collection can still know whether the
 * caller liked each item.
 *
 * `PassportModule.register({ defaultStrategy: 'jwt' })` lives in AuthModule,
 * which AppModule imports, so this guard works from any module without
 * importing AuthModule.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser | undefined>(
    err: unknown,
    user: unknown,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    // A strategy blowing up is a real failure; a failed authentication is not.
    if (err) {
      throw err;
    }
    // passport hands us `false` when the strategy rejected the request.
    return (user || undefined) as TUser;
  }
}

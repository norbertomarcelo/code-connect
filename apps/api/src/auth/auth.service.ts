import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }

    return { id: user.id, name: user.name, email: user.email };
  }

  login(user: AuthenticatedUser): {
    accessToken: string;
    expiresAt: string;
    user: AuthenticatedUser;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    const accessToken = this.jwtService.sign(payload);
    const { exp } = this.jwtService.decode<{ exp: number }>(accessToken);

    return {
      accessToken,
      expiresAt: new Date(exp * 1000).toISOString(),
      user,
    };
  }
}

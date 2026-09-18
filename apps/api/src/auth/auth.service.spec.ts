import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret',
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);

    await usersService.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });
  });

  it('returns the user without the password hash for correct credentials', async () => {
    const user = await authService.validateUser(
      'ada@example.com',
      'super-secret-1',
    );

    expect(user).toEqual({
      id: expect.any(String),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('returns null for an incorrect password', async () => {
    const user = await authService.validateUser(
      'ada@example.com',
      'wrong-password',
    );

    expect(user).toBeNull();
  });

  it('returns null for an unknown email', async () => {
    const user = await authService.validateUser(
      'missing@example.com',
      'super-secret-1',
    );

    expect(user).toBeNull();
  });

  it('signs a JWT with an expiry when logging in', async () => {
    const user = await authService.validateUser(
      'ada@example.com',
      'super-secret-1',
    );
    const session = authService.login(user!);

    expect(session.accessToken).toEqual(expect.any(String));
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(session.user).toEqual(user);
  });
});

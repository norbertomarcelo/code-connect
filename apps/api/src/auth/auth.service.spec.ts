import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createTestDatabase } from '../../test/support/test-database.js';
import { DRIZZLE } from '../database/database.constants.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { resetDatabase } from '../../test/support/reset-database.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let testDb: Awaited<ReturnType<typeof createTestDatabase>>;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await resetDatabase(testDb.db);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: DRIZZLE, useValue: testDb.db },
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

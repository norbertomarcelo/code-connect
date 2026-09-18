import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = { validateUser: vi.fn(), login: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthController);
  });

  it('logs in and returns the session payload', async () => {
    const user = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockReturnValue({
      accessToken: 'signed-token',
      expiresAt: '2026-09-16T15:00:00.000Z',
      user,
    });

    const result = await controller.login({
      email: 'ada@example.com',
      password: 'super-secret-1',
    });

    expect(result.accessToken).toBe('signed-token');
  });

  it('throws unauthorized for invalid credentials', async () => {
    authService.validateUser.mockResolvedValue(null);

    await expect(
      controller.login({ email: 'ada@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the authenticated user from the request', () => {
    const currentUser = {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    };

    expect(controller.getCurrentUser(currentUser)).toBe(currentUser);
  });
});

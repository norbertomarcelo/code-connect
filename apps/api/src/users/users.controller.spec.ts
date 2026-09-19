import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { create: ReturnType<typeof vi.fn> };

  const setHeader = vi.fn();
  const fakeResponse = { setHeader } as unknown as Response;

  beforeEach(async () => {
    usersService = { create: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('creates a user and sets the Location header, excluding the password hash', async () => {
    usersService.create.mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: 'hashed',
    });

    const result = await controller.create(
      {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'super-secret-1',
      },
      fakeResponse,
    );

    expect(result).toEqual({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(setHeader).toHaveBeenCalledWith(
      'Location',
      '/users/user-1',
    );
  });
});

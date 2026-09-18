import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a user with a hashed password', async () => {
    const user = await service.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Ada Lovelace');
    expect(user.email).toBe('ada@example.com');
    expect(user.passwordHash).not.toBe('super-secret-1');
  });

  it('throws a conflict when the email is already registered', async () => {
    await service.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });

    await expect(
      service.create({
        name: 'Another Ada',
        email: 'ada@example.com',
        password: 'another-secret',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('finds a user by email', async () => {
    await service.create({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });

    expect(service.findByEmail('ada@example.com')?.name).toBe('Ada Lovelace');
    expect(service.findByEmail('missing@example.com')).toBeUndefined();
  });
});

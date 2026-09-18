import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createTestDatabase } from '../../test/support/test-database.js';
import { DRIZZLE } from '../database/database.constants.js';
import { UsersService } from './users.service.js';
import { resetDatabase } from '../../test/support/reset-database.js';

describe('UsersService', () => {
  let service: UsersService;
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
      providers: [UsersService, { provide: DRIZZLE, useValue: testDb.db }],
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

    expect((await service.findByEmail('ada@example.com'))?.name).toBe(
      'Ada Lovelace',
    );
    expect(await service.findByEmail('missing@example.com')).toBeUndefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { createTestDatabase } from '../../test/support/test-database.js';
import { resetDatabase } from '../../test/support/reset-database.js';
import { DRIZZLE } from '../database/database.constants.js';
import { TagsService } from './tags.service.js';

describe('TagsService', () => {
  let service: TagsService;
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
      providers: [TagsService, { provide: DRIZZLE, useValue: testDb.db }],
    }).compile();

    service = module.get(TagsService);
  });

  it('creates tags from labels and returns their ids', async () => {
    const ids = await service.resolveOrCreate(['React', 'Front-end']);

    expect(ids).toHaveLength(2);
    expect(await service.findAll()).toEqual([
      { slug: 'front-end', label: 'Front-end' },
      { slug: 'react', label: 'React' },
    ]);
  });

  it('reuses an existing tag instead of duplicating it', async () => {
    const [first] = await service.resolveOrCreate(['React']);
    const [second] = await service.resolveOrCreate(['react ']);

    expect(second).toBe(first);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('ignores blank labels', async () => {
    expect(await service.resolveOrCreate(['', '  ', '!!!'])).toEqual([]);
  });

  it('returns an empty map for no post ids', async () => {
    expect((await service.findByPostIds([])).size).toBe(0);
  });
});

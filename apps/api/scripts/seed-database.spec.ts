import { count, eq, isNotNull, isNull, type SQL } from 'drizzle-orm';
import { alias, type PgTable } from 'drizzle-orm/pg-core';
import { createTestDatabase } from '../test/support/test-database.js';
import * as schema from '../src/database/schema.js';
import { seedDatabase } from './seed-database.js';

describe('seedDatabase', () => {
  let testDb: Awaited<ReturnType<typeof createTestDatabase>>;

  const total = async (table: PgTable, where?: SQL) => {
    const [row] = await testDb.db
      .select({ value: count() })
      .from(table)
      .where(where);
    return row.value;
  };

  beforeAll(async () => {
    testDb = await createTestDatabase();
    await seedDatabase(testDb.db);
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('fills every table', async () => {
    expect(await total(schema.users)).toBe(4);
    expect(await total(schema.tags)).toBe(8);
    expect(await total(schema.posts)).toBe(8);
    expect(await total(schema.postLikes)).toBeGreaterThan(0);
  });

  it('leaves 3 posts without a thumbnail, to exercise the placeholder', async () => {
    expect(await total(schema.posts, isNull(schema.posts.thumbnailUrl))).toBe(
      3,
    );
  });

  it('creates 12 root comments and 6 replies', async () => {
    expect(await total(schema.comments, isNull(schema.comments.parentId))).toBe(
      12,
    );
    expect(
      await total(schema.comments, isNotNull(schema.comments.parentId)),
    ).toBe(6);
  });

  it('nests replies exactly one level deep', async () => {
    const parent = alias(schema.comments, 'parent');

    const grandchildren = await testDb.db
      .select({ id: schema.comments.id })
      .from(schema.comments)
      .innerJoin(parent, eq(schema.comments.parentId, parent.id))
      .where(isNotNull(parent.parentId));

    expect(grandchildren).toEqual([]);
  });

  it('is idempotent', async () => {
    await seedDatabase(testDb.db);

    expect(await total(schema.users)).toBe(4);
    expect(await total(schema.posts)).toBe(8);
    expect(await total(schema.comments)).toBe(18);
  });
});

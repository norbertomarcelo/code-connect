import { sql } from 'drizzle-orm';
import type { Database } from '../../src/database/database.constants.js';

/**
 * One statement, so the FK graph never has to be torn down in order. CASCADE
 * is belt-and-braces: every referencing table is already listed.
 */
export async function resetDatabase(db: Database): Promise<void> {
  await db.execute(
    sql`TRUNCATE users, tags, posts, post_tags, post_likes, comments CASCADE`,
  );
}

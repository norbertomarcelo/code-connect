/**
 * pnpm db:up && pnpm api db:migrate && pnpm api db:seed
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseUrl } from '../src/database/database.constants.js';
import * as schema from '../src/database/schema.js';
import { PASSWORD, seedDatabase } from './seed-database.js';

const pool = new Pool({ connectionString: databaseUrl });

try {
  const summary = await seedDatabase(drizzle({ client: pool, schema }));

  console.info(
    `Seeded ${summary.users} users, ${summary.tags} tags and ${summary.posts} posts.`,
  );
  console.info(`Log in as julio@codeconnect.dev / ${PASSWORD}`);
} finally {
  await pool.end();
}

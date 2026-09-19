import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Vitest applies `test.env` to the workers, not to this main-process hook, so
// the URL is repeated here instead of read from vitest.config.e2e.ts.
const testDatabaseUrl =
  'postgres://codeconnect:codeconnect@localhost:5432/codeconnect_test';

export default async function setup() {
  const pool = new Pool({ connectionString: testDatabaseUrl });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: 'drizzle' });
  } finally {
    await pool.end();
  }
}

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from './schema.js';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE = Symbol('DRIZZLE');

export const databaseUrl =
  process.env.DATABASE_URL ??
  'postgres://codeconnect:codeconnect@localhost:5432/codeconnect';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

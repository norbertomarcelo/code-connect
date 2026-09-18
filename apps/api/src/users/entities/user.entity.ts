import type { users } from '../../database/schema.js';

export type User = typeof users.$inferSelect;

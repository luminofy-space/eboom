// eboom-backend/src/db/client.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const sql = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(sql, { schema });
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
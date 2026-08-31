import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  // Tables live in domain schemas; `public` is intentionally empty, so keep
  // drizzle-kit from treating anything there as drift it should drop.
  schemaFilter: ['reference', 'identity', 'finance', 'workspace', 'ai'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
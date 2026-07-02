// eboom-backend/src/db/migrate.ts

import path from 'path';
import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './client';

const migrationsFolder = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log('⏳ Running migrations...');

  try {
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
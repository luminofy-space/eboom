// eboom-backend/src/db/reset.ts

import { sql as pgSql } from './client';
import seed from './seed/seed';

async function reset() {
  console.log('⚠️  WARNING: This will delete ALL data!');
  console.log('⏳ Resetting database...\n');

  try {
    // Drop all tables (cascade)
    await pgSql.unsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('✅ All tables dropped');

    // Re-run migrations
    console.log('\n⏳ Running migrations...');
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    const { db } = await import('./client');
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Migrations completed');

    // Re-seed
    console.log('\n⏳ Re-seeding database...');
    await seed();

    console.log('\n✅ Database reset complete');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

reset();
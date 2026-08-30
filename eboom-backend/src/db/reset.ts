// Resets the database and re-runs the base SQL seed files.
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql as pgSql } from './client';
import { seed } from './seed/seed';

async function reset() {
  console.log('⚠️  WARNING: This will delete ALL data!');
  console.log('⏳ Resetting database...\n');

  try {
    // Tables live in domain schemas now, not public. Dropping public alone
    // would leave every table standing.
    // `client_min_messages` mutes the "drop cascades to ..." NOTICE storm the
    // CASCADE drops emit — expected here, and it buries the real output.
    // The grant goes to CURRENT_USER: the connection role comes from
    // DATABASE_URL (`eboom` in Docker), and hardcoding `postgres` fails with
    // `role "postgres" does not exist`.
    await pgSql.unsafe(`
      SET client_min_messages = warning;
      DROP SCHEMA IF EXISTS reference CASCADE;
      DROP SCHEMA IF EXISTS identity CASCADE;
      DROP SCHEMA IF EXISTS finance CASCADE;
      DROP SCHEMA IF EXISTS workspace CASCADE;
      DROP SCHEMA IF EXISTS ai CASCADE;
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO CURRENT_USER;
      GRANT ALL ON SCHEMA public TO public;
    `);

    console.log('✅ All tables dropped');

    // Rebuild from the committed migrations, not `drizzle-kit push`. Dropping
    // the `drizzle` schema above wiped the migration journal, so replaying the
    // migrations leaves it repopulated — a later `db:migrate` then sees an
    // up-to-date database instead of trying to re-apply 0000 and failing.
    console.log('\n⏳ Applying migrations...');
    await migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
    console.log('✅ Schema applied');

    // Re-seed
    // Base seeds only — the reference rows the app needs to boot. Demo users
    // and their data are opt-in via `npm run db:seed:demo`.
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

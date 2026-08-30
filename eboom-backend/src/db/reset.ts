// Resets the database and re-runs the SQL seed files.
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql as pgSql } from './client';
import fs from 'fs';

async function executeSqlFileInTransaction(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`📄 Processing: ${fileName}`);

  await pgSql.begin(async (tx) => {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    await tx.unsafe(sqlContent);
  });

  console.log(`✅ Committed: ${fileName}`);
}

async function seedSafe() {
  const seedsDir = path.join(__dirname, 'seed', 'sql');
  const sqlFiles = fs
    .readdirSync(seedsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    await executeSqlFileInTransaction(path.join(seedsDir, file));
  }
}

async function reset() {
  console.log('⚠️  WARNING: This will delete ALL data!');
  console.log('⏳ Resetting database...\n');

  try {
    // Drop all tables (cascade)
    await pgSql.unsafe(`
      DROP SCHEMA public CASCADE;
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
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
    console.log('\n⏳ Re-seeding database...');
    await seedSafe();

    console.log('\n✅ Database reset complete');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

reset();
// eboom-backend/src/db/reset.ts

import { execSync } from 'child_process';
import path from 'path';
import { sql as pgSql } from './client';
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

  const backendRoot = path.join(__dirname, '..', '..');

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

    // Apply schema from Drizzle (migrations folder is not populated in this repo)
    console.log('\n⏳ Applying schema (drizzle-kit push)...');
    execSync('npx drizzle-kit push --force', {
      cwd: backendRoot,
      stdio: 'inherit',
    });
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
// Runs only the demo-data SQL seed files, each in its own transaction.
import { sql as pgSql } from '../client';
import fs from 'fs';
import path from 'path';

async function executeSqlFileInTransaction(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`📄 Processing: ${fileName}`);

  await pgSql.begin(async (tx) => {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    await tx.unsafe(sqlContent);
  });

  console.log(`✅ Committed: ${fileName}`);
}

async function seedDemo() {
  console.log('⏳ Seeding demo data...\n');

  const seedsDir = path.join(__dirname, 'sql');

  try {
    const sqlFiles = fs
      .readdirSync(seedsDir)
      .filter(file => file.endsWith('.demo.sql'))
      .sort();

    if (sqlFiles.length === 0) {
      console.log('No demo seed files found.');
      return;
    }

    console.log(`Found ${sqlFiles.length} demo seed file(s)\n`);

    for (const file of sqlFiles) {
      await executeSqlFileInTransaction(path.join(seedsDir, file));
    }

    console.log('\n✅ Demo data seeded successfully');
  } catch (error) {
    console.error('\n❌ Demo seeding failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

seedDemo();

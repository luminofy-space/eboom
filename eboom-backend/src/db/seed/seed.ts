// eboom-backend/src/db/seed.ts

import { sql as pgSql } from '../client';
import fs from 'fs';
import path from 'path';

async function executeSqlFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`📄 Executing: ${fileName}`);

  try {
    const rawSql = fs.readFileSync(filePath, 'utf-8')
      .replace(/^\s*BEGIN\s*;/gim, '')
      .replace(/^\s*COMMIT\s*;/gim, '')
      .trim();

    // Split into individual statements, add ON CONFLICT DO NOTHING to all INSERTs
    const statements = rawSql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => /^INSERT\s+INTO/i.test(s) ? s + '\nON CONFLICT DO NOTHING' : s)
      .join(';\n\n') + ';';

    await pgSql.begin(tx => tx.unsafe(statements));
    console.log(`✅ Completed: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed: ${fileName}`, error);
    throw error;
  }
}

async function seed() {
  console.log('⏳ Seeding database...\n');

  const seedsDir = path.join(__dirname, 'sql');
  
  try {
    // Get all SQL files in seeds directory
    const sqlFiles = fs
      .readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensures they run in order (001, 002, etc.)

    console.log(`Found ${sqlFiles.length} seed files\n`);

    // Execute each SQL file in order
    for (const file of sqlFiles) {
      const filePath = path.join(seedsDir, file);
      await executeSqlFile(filePath);
    }

    console.log('\n✅ All seeds completed successfully');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seed().finally(() => pgSql.end());
}

export default seed;
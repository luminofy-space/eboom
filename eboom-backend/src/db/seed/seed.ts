// eboom-backend/src/db/seed.ts

import { sql as pgSql } from '../client';
import fs from 'fs';
import path from 'path';

async function executeSqlFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`📄 Executing: ${fileName}`);

  try {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split by semicolons but be careful with strings
    // For complex SQL, you might want to use a proper SQL parser
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        await pgSql.unsafe(statement);
      }
    }

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
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seed();
}

export default seed;
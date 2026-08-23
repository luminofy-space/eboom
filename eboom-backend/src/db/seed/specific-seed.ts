// Runs a single named SQL seed file, chosen by matching its filename.
import { sql as pgSql } from '../client';
import fs from 'fs';
import path from 'path';

async function executeSqlFile(filePath: string) {
  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (statement) {
      await pgSql.unsafe(statement);
    }
  }
}

async function seedSpecific(seedName: string) {
  console.log(`⏳ Running seed: ${seedName}...\n`);

  const seedsDir = path.join(__dirname, 'sql');
  
  try {
    // Find the seed file
    const sqlFiles = fs.readdirSync(seedsDir).filter(file => 
      file.endsWith('.sql') && file.includes(seedName)
    );

    if (sqlFiles.length === 0) {
      throw new Error(`No seed file found matching: ${seedName}`);
    }

    for (const file of sqlFiles) {
      console.log(`📄 Executing: ${file}`);
      const filePath = path.join(seedsDir, file);
      await executeSqlFile(filePath);
      console.log(`✅ Completed: ${file}`);
    }

    console.log('\n✅ Seed completed successfully');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

// Get seed name from command line
const seedName = process.argv[2];
if (!seedName) {
  console.error('Usage: npm run db:seed:specific <seed-name>');
  process.exit(1);
}

seedSpecific(seedName);
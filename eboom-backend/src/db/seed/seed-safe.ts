// Runs each SQL seed file in its own transaction, rolling back failures individually.
import { sql as pgSql } from '../client';
import fs from 'fs';
import path from 'path';

interface SeedResult {
  file: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

async function executeSqlFileInTransaction(filePath: string): Promise<SeedResult> {
  const fileName = path.basename(filePath);
  console.log(`📄 Processing: ${fileName}`);

  try {
    await pgSql.begin(async (tx) => {
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      
      // Execute the entire file as one transaction
      await tx.unsafe(sqlContent);
    });

    console.log(`✅ Committed: ${fileName}`);
    return { file: fileName, status: 'success' };
  } catch (error: any) {
    console.error(`❌ Rolled back: ${fileName}`, error.message);
    return { 
      file: fileName, 
      status: 'failed', 
      error: error.message 
    };
  }
}

async function seedSafe() {
  console.log('⏳ Seeding database (transaction-safe)...\n');

  const seedsDir = path.join(__dirname, 'sql');
  const results: SeedResult[] = [];
  
  try {
    const sqlFiles = fs
      .readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql') && !file.endsWith('.demo.sql'))
      .sort();

    console.log(`Found ${sqlFiles.length} seed files\n`);

    for (const file of sqlFiles) {
      const filePath = path.join(seedsDir, file);
      const result = await executeSqlFileInTransaction(filePath);
      results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SEED SUMMARY:');
    console.log('='.repeat(50));
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed seeds:');
      results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.file}: ${r.error}`));
      
      process.exit(1);
    }

    console.log('\n✅ All seeds completed successfully');
  } catch (error) {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

seedSafe();
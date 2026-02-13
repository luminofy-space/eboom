// eboom-backend/src/db/seed-hybrid.ts

import { db, sql as pgSql } from '../client';
import { currencies, roles } from '../schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function executeSqlFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`📄 Executing: ${fileName}`);

  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  await pgSql.unsafe(sqlContent);

  console.log(`✅ Completed: ${fileName}`);
}

async function validateSeeds() {
  console.log('\n🔍 Validating seeded data...\n');

  // Validate currencies
  const currencyCount = await db.select().from(currencies);
  console.log(`✓ Currencies: ${currencyCount.length} records`);

  // Validate roles
  const roleCount = await db.select().from(roles).where(eq(roles.isSystemRole, true));
  console.log(`✓ System Roles: ${roleCount.length} records`);

  // Add more validations as needed
}

async function seedWithValidation() {
  console.log('⏳ Seeding database with validation...\n');

  const seedsDir = path.join(__dirname, 'sql');
  
  try {
    const sqlFiles = fs
      .readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      const filePath = path.join(seedsDir, file);
      await executeSqlFile(filePath);
    }

    // Validate after all seeds
    await validateSeeds();

    console.log('\n✅ All seeds completed and validated successfully');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pgSql.end();
  }
}

seedWithValidation();
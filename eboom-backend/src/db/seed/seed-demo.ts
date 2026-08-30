// Runs only the demo-data SQL seed files (*.demo.sql), reusing the runner in seed.ts.
import { sql as pgSql } from '../client';
import { listSeedFiles, runSeedFiles } from './seed';

async function seedDemo(): Promise<void> {
  const files = listSeedFiles('demo');

  if (files.length === 0) {
    console.log('No demo seed files found.');
    return;
  }

  console.log(`⏳ Seeding demo data — ${files.length} file(s)\n`);
  await runSeedFiles(files);
}

seedDemo()
  .then(() => console.log('\n✅ Demo data seeded successfully'))
  .catch(error => {
    console.error('\n❌ Demo seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pgSql.end());

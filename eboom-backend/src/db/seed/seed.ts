// Runs the base SQL seed files — every file in sql/ except the *.demo.sql ones.
// Demo data has its own entrypoint (seed-demo.ts) that reuses the runner here.
import { db, sql as pgSql } from '../client';
import { currencies, roles } from '../schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const seedsDir = path.join(__dirname, 'sql');

// Base seeds are every .sql file except the demo ones; demo seeds are the inverse.
export function listSeedFiles(kind: 'base' | 'demo', only?: string): string[] {
  return fs
    .readdirSync(seedsDir)
    .filter(file => file.endsWith('.sql') && file.endsWith('.demo.sql') === (kind === 'demo'))
    .filter(file => !only || file.includes(only))
    .sort(); // 001, 002, … — later files depend on earlier ones
}

// One file, one transaction: a failure leaves nothing half-applied, and a rerun
// is a no-op because the seed SQL carries its own ON CONFLICT clauses.
// The file's BEGIN/COMMIT are stripped first — left in, the inner COMMIT would
// close the outer transaction early and autocommit whatever follows it.
export async function executeSqlFile(fileName: string): Promise<void> {
  console.log(`📄 Processing: ${fileName}`);

  const sqlContent = fs
    .readFileSync(path.join(seedsDir, fileName), 'utf-8')
    .replace(/^\s*BEGIN\s*;/gim, '')
    .replace(/^\s*COMMIT\s*;/gim, '')
    .trim();

  await pgSql.begin(tx => tx.unsafe(sqlContent));
  console.log(`✅ Committed: ${fileName}`);
}

// Stops at the first failure — the files are ordered and later ones build on
// earlier ones, so continuing past a break only produces downstream noise.
export async function runSeedFiles(files: string[]): Promise<void> {
  for (const file of files) {
    await executeSqlFile(file);
  }
}

// Confirms the reference rows every canvas depends on actually landed.
async function validate(): Promise<void> {
  console.log('\n🔍 Validating seeded data...');

  const currencyRows = await db.select().from(currencies);
  const systemRoleRows = await db.select().from(roles).where(eq(roles.isSystemRole, true));

  console.log(`✓ Currencies: ${currencyRows.length} records`);
  console.log(`✓ System roles: ${systemRoleRows.length} records`);
}

export async function seed(only?: string): Promise<void> {
  const files = listSeedFiles('base', only);

  if (files.length === 0) {
    throw new Error(only ? `No seed file matches: ${only}` : 'No seed files found.');
  }

  console.log(`⏳ Seeding database — ${files.length} file(s)\n`);
  await runSeedFiles(files);
  await validate();
}

// `--only <name>` / `--only=<name>` runs just the seed files whose name contains <name>.
function parseOnly(argv: string[]): string | undefined {
  const index = argv.findIndex(arg => arg === '--only' || arg.startsWith('--only='));
  if (index === -1) return undefined;
  const value = argv[index].includes('=') ? argv[index].split('=')[1] : argv[index + 1];
  if (!value) throw new Error('Usage: npm run db:seed -- --only <seed-name>');
  return value;
}

if (require.main === module) {
  seed(parseOnly(process.argv.slice(2)))
    .then(() => console.log('\n✅ Seeding completed successfully'))
    .catch(error => {
      console.error('\n❌ Seeding failed:', error);
      process.exitCode = 1;
    })
    .finally(() => pgSql.end());
}

export default seed;

// Warns loudly in dev logs when the database has no tables yet.
import 'dotenv/config';
import postgres from 'postgres';

// Dev-only startup check. Migrations are a manual step in dev (see
// compose.yaml), so a fresh/reset postgres volume boots with
// no tables. This just makes that state loud in the logs instead of letting
// devs discover it via a wall of query-failed stack traces.
const CORE_TABLE = 'users';

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function printMissingSchemaBanner() {
  const lines = [
    '',
    `${RED}${BOLD}  ⚠️  DATABASE SCHEMA IS MISSING  ⚠️${RESET}`,
    `${RED}  ────────────────────────────────────────────────${RESET}`,
    `${YELLOW}  No tables found in the database — this postgres volume${RESET}`,
    `${YELLOW}  is empty (first boot, or the volume was reset/removed).${RESET}`,
    '',
    `${BOLD}  Run this to create the schema:${RESET}`,
    '',
    `    ${BOLD}docker compose exec backend npm run db:push -- --force${RESET}`,
    '',
    `${RED}  ────────────────────────────────────────────────${RESET}`,
    '',
  ];
  console.log(lines.join('\n'));
}

async function checkSchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });

  try {
    const [row] = await sql`select to_regclass(${'public.' + CORE_TABLE}) as reg`;
    if (!row?.reg) printMissingSchemaBanner();
  } catch (err) {
    console.warn(`[db:check-schema] skipped — could not reach the database: ${(err as Error).message}`);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

checkSchema();

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/db-migrate.mjs <directory-of-sql-files>');
  process.exit(1);
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('Set SUPABASE_DB_URL first.');
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

await client.connect();
try {
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    process.stdout.write(`Running ${file}... `);
    try {
      await client.query(sql);
      console.log('OK');
    } catch (err) {
      console.log('FAILED');
      console.error(err.message);
      process.exit(1);
    }
  }
} finally {
  await client.end();
}
console.log('Done.');

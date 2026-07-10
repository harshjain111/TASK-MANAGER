import { Client } from 'pg';

const connectionString = process.env.SUPABASE_DB_URL;
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name;
`);
console.log('Tables:', rows.map((r) => r.table_name).join(', '));

const { rows: rls } = await client.query(`
  select relname, relrowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and relkind = 'r' order by relname;
`);
console.log('\nRLS status:');
for (const r of rls) console.log(`  ${r.relname}: ${r.relrowsecurity ? 'enabled' : 'DISABLED'}`);

await client.end();

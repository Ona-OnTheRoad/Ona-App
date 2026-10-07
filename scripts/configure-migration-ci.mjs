#!/usr/bin/env node
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Provide the isolated CI project directory");
const path = resolve(root, "supabase/config.toml");
const config = readFileSync(path, "utf8");
if (!config.includes('project_id = "ona-migration-ci"') ||
    !config.includes("[db.migrations]\nenabled = false")) {
  throw new Error("Expected fresh isolated CI project with application migrations disabled");
}
// Provision only the documented storage-policy DDL delegation on the disposable
// local stack. No hosted URL, app credentials, table ownership or user grants.
const client = new pg.Client({ connectionString: "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" });
await client.connect();
try {
  await client.query(`ALTER SYSTEM SET supautils.policy_grants = '{"postgres":["storage.objects"]}'`);
  await client.query("SELECT pg_reload_conf()");
} finally { await client.end(); }
const migrationClient = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
await migrationClient.connect();
try {
  // Exercise the actual non-owner executor before application SQL. No test policy
  // survives this transaction, and failure leaves replay disabled.
  await migrationClient.query("BEGIN");
  await migrationClient.query('CREATE POLICY "ona_ci_policy_probe" ON storage.objects FOR SELECT USING (false)');
  await migrationClient.query("ROLLBACK");
} finally { await migrationClient.end(); }
writeFileSync(path, config.replace("[db.migrations]\nenabled = false", "[db.migrations]\nenabled = true"));
console.log("Configured local storage-policy delegation; full application replay enabled");

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
// Local migration executor needs storage owner privileges for expressions in
// policies. This is a disposable fixture, not a hosted provisioning procedure.
// No hosted URL, app credentials, table ownership or client-role grants.
const client = new pg.Client({ connectionString: "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" });
await client.connect();
try {
  await client.query("GRANT supabase_storage_admin TO postgres WITH INHERIT TRUE");
} finally { await client.end(); }
const migrationClient = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
await migrationClient.connect();
try {
  // Exercise the actual non-owner executor before application SQL. No test policy
  // survives this transaction, and failure leaves replay disabled.
  await migrationClient.query("BEGIN");
  await migrationClient.query(readFileSync("supabase/migrations/20260729_038_avatars_storage.sql", "utf8"));
  await migrationClient.query("ROLLBACK");
} finally { await migrationClient.end(); }
writeFileSync(path, config.replace("[db.migrations]\nenabled = false", "[db.migrations]\nenabled = true"));
console.log("Verified complete avatar policy SQL under local migration executor; full replay enabled");

#!/usr/bin/env node
import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Provide the isolated CI project directory");
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");
if (!config.includes('project_id = "ona-migration-ci"')) throw new Error("Expected isolated CI project");
const manifest = JSON.parse(readFileSync(resolve(root, "migration-manifest.json"), "utf8"));
const client = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
await client.connect();
try {
  await client.query("CREATE SCHEMA IF NOT EXISTS supabase_migrations");
  await client.query("CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, name text, statements text[])");
  const applied = await client.query("SELECT version FROM supabase_migrations.schema_migrations");
  if (applied.rowCount) throw new Error("Replay requires a fresh application migration ledger");
  for (const row of manifest) {
    console.log(`Applying ${row.source}`);
    const sql = readFileSync(resolve(root, "supabase/migrations", row.staged), "utf8");
    try {
      // Full file, simple protocol: implicit batch transactions and explicit
      // source BEGIN/COMMIT blocks are honored. No SQL filtering or omissions.
      await client.query(sql);
      await client.query("INSERT INTO supabase_migrations.schema_migrations(version, name, statements) VALUES ($1,$2,$3)",
        [row.version, row.source, [sql]]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${row.source} failed: ${error.message}`);
    }
  }
} finally { await client.end(); }

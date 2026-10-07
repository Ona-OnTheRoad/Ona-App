#!/usr/bin/env node
import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Provide the isolated CI project directory");
const manifest = JSON.parse(readFileSync(resolve(root, "migration-manifest.json"), "utf8"));
// Fixed local destination only. Never read .env or accept a hosted DATABASE_URL.
const client = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
await client.connect();
try {
  const { rows } = await client.query("select version from supabase_migrations.schema_migrations order by version");
  if (JSON.stringify(rows.map(row => row.version)) !== JSON.stringify(manifest.map(row => row.version))) {
    throw new Error("Migration history differs from full replay manifest");
  }
  await client.query(readFileSync("scripts/migration-ci-assertions.sql", "utf8"));
  console.log(`Verified ${rows.length} migrations, critical schema and role boundaries`);
} finally {
  await client.end();
}

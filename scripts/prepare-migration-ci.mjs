#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// CI-only normalized copy: hosted migration ledgers retain original filenames.
const destination = process.argv[2];
if (!destination) throw new Error("Provide a NEW isolated temporary project directory");
const root = resolve(destination);
mkdirSync(root, { recursive: false }); // Refuse to overwrite an existing project.
mkdirSync(resolve(root, "supabase/migrations"), { recursive: true });
writeFileSync(resolve(root, "supabase/config.toml"),
  readFileSync("supabase/config.toml", "utf8")
    .replace('project_id = "ona-local"', 'project_id = "ona-migration-ci"')
    // Use the pinned CLI's current local stack; no hosted database is upgraded.
    .replace(/major_version = \d+/, "major_version = 17"));
const files = readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort();
if (!files.length) throw new Error("No migrations found");
const manifest = files.map((source, index) => {
  if (!/^\d{8}_\d{3}_[a-z0-9_]+\.sql$/.test(source)) throw new Error(`Unexpected migration filename: ${source}`);
  const stamp = new Date(Date.UTC(2000, 0, 1) + index * 1000).toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const staged = `${stamp}_${source}`;
  writeFileSync(resolve(root, "supabase/migrations", staged), readFileSync(resolve("supabase/migrations", source)));
  return { source, version: stamp, staged };
});
writeFileSync(resolve(root, "migration-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared ${files.length} migrations in existing lexical replay order`);

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("isolated migration replay project", () => {
  it("copies the whole collision-prone history in order without changing SQL or source names", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "ona-migration-test-"));
    const destination = path.join(parent, "project");
    const source = readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort();
    try {
      execFileSync(process.execPath, ["scripts/prepare-migration-ci.mjs", destination]);
      const manifest: Array<{ source: string; version: string; staged: string }> =
        JSON.parse(readFileSync(path.join(destination, "migration-manifest.json"), "utf8"));
      expect(manifest.map(row => row.source)).toEqual(source);
      expect(new Set(manifest.map(row => row.version)).size).toBe(source.length);
      expect(readdirSync(path.join(destination, "supabase/migrations")).sort()).toEqual(manifest.map(row => row.staged));
      for (const row of manifest) {
        expect(readFileSync(path.join(destination, "supabase/migrations", row.staged)))
          .toEqual(readFileSync(path.join("supabase/migrations", row.source)));
      }
      expect(readFileSync(path.join(destination, "supabase/config.toml"), "utf8"))
        .toContain('project_id = "ona-migration-ci"');
      expect(readFileSync(path.join(destination, "supabase/.temp/postgres-version"), "utf8"))
        .toBe("15.8.1.099");
      expect(() => execFileSync(process.execPath, ["scripts/prepare-migration-ci.mjs", destination],
        { stdio: "pipe" })).toThrow();
    } finally { rmSync(parent, { recursive: true, force: true }); }
  });
});

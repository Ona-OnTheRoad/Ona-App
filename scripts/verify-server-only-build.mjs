#!/usr/bin/env node
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

// Negative compilation fixture: real server entry point, real Next guard, no Vitest alias.
const root = resolve(".");
const fixture = mkdtempSync(join(tmpdir(), "ona-server-boundary-"));
try {
  mkdirSync(join(fixture, "app"));
  symlinkSync(join(root, "node_modules"), join(fixture, "node_modules"), "dir");
  writeFileSync(join(fixture, "package.json"), JSON.stringify({ private: true,
    dependencies: { next: "16.3.7", react: "19.2.4", "react-dom": "19.2.4" } }));
  writeFileSync(join(fixture, "tsconfig.json"), JSON.stringify({ compilerOptions: {
    jsx: "preserve", moduleResolution: "bundler", module: "esnext", esModuleInterop: true,
    baseUrl: root, paths: { "@/*": ["src/*"] },
  } }));
  writeFileSync(join(fixture, "app/layout.tsx"),
    'export default function Layout({children}) { return <html><body>{children}</body></html>; }\n');
  writeFileSync(join(fixture, "app/page.tsx"),
    '"use client";\nimport { createServiceSupabase } from ' + JSON.stringify(join(root, "src/lib/supabase/server")) + ';\n' +
    'export default function Page() { return <div>{String(createServiceSupabase)}</div>; }\n');
  const result = spawnSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"),
    "build", "--webpack", fixture], { cwd: fixture, encoding: "utf8", timeout: 45_000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
  const output = (result.stdout || "") + (result.stderr || "");
  if (result.error || result.status === 0 ||
      !/You're importing (?:a component that needs|a module that depends on) ["']server-only["']/.test(output)) {
    throw new Error("Expected a Next client/server boundary rejection.\n" + output.slice(-5000));
  }
  console.log("Verified: Next rejects a client import of the real service-role entry point");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

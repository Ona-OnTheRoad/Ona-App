#!/usr/bin/env node
/**
 * Stage 6 drift guard: every registered OpenAPI path must map to a route.ts.
 * Run: npm run check:openapi-drift
 */
import { readdirSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const root = process.cwd();

function openApiPathToFs(openApiPath) {
  const withoutApi = openApiPath.replace(/^\/api/, "") || "";
  const segments = withoutApi
    .split("/")
    .filter(Boolean)
    .map((s) =>
      s.startsWith("{") && s.endsWith("}") ? `[${s.slice(1, -1)}]` : s,
    );
  return join(root, "src/app/api", ...segments, "route.ts");
}

function countRouteFiles(dir = join(root, "src/app/api")) {
  let n = 0;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) n += countRouteFiles(p);
    else if (ent.name === "route.ts") n += 1;
  }
  return n;
}

const stubDir = mkdtempSync(join(tmpdir(), "ona-openapi-"));
const stubPath = join(stubDir, "server-only.js");
writeFileSync(stubPath, "module.exports = {};\n");

const probe = `
  const Module = require('module');
  const orig = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'server-only') return ${JSON.stringify(stubPath)};
    return orig.call(this, request, parent, isMain, options);
  };
  require('tsx/cjs');
  const { listRegisteredOpenApiPaths } = require('./src/lib/server/openapi/document.ts');
  process.stdout.write(JSON.stringify(listRegisteredOpenApiPaths()));
`;

const result = spawnSync(process.execPath, ["-e", probe], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, NODE_ENV: "test" },
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const paths = JSON.parse(result.stdout);
const missing = [];
for (const p of paths) {
  const fsPath = openApiPathToFs(p);
  if (!existsSync(fsPath)) missing.push({ openApiPath: p, expected: fsPath });
}

const totalRoutes = countRouteFiles();
console.log(
  JSON.stringify(
    {
      registeredPaths: paths.length,
      routeFiles: totalRoutes,
      missing,
      ok: missing.length === 0,
    },
    null,
    2,
  ),
);

if (missing.length) {
  console.error("OpenAPI drift: registered paths without route.ts");
  process.exit(1);
}

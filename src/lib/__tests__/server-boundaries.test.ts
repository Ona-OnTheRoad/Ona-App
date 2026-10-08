import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = path.resolve("src");
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : files(filename);
    return /\.(ts|tsx)$/.test(filename) && !/\.(test|d)\.tsx?$/.test(filename) ? [filename] : [];
  });
}
function source(filename: string) {
  return ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
}
function imports(file: ts.SourceFile): string[] {
  const result: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const named = clause?.namedBindings;
      const onlyTypes = clause?.isTypeOnly || (!clause?.name && named && ts.isNamedImports(named)
        && named.elements.length > 0 && named.elements.every(element => element.isTypeOnly));
      if (!onlyTypes) result.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const onlyTypes = node.exportClause && ts.isNamedExports(node.exportClause)
        && node.exportClause.elements.every(element => element.isTypeOnly);
      if (!onlyTypes) result.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) result.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}
function resolveLocal(filename: string, specifier: string) {
  const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".") ? path.resolve(path.dirname(filename), specifier) : null;
  if (!base) return null;
  return [base + ".ts", base + ".tsx", path.join(base, "index.ts"), path.join(base, "index.tsx")]
    .find(candidate => existsSync(candidate)) || null;
}

describe("server boundaries", () => {
  it("guards every server runtime module and service-role Supabase entry point", () => {
    const runtimeFiles = [...files(path.join(root, "lib/server")), path.join(root, "lib/supabase/server.ts")];
    const unguarded = runtimeFiles.filter(filename => !imports(source(filename)).includes("server-only"));
    expect(unguarded.map(filename => path.relative(root, filename))).toEqual([]);
  });
  it("has no direct or transitive server imports from browser entry points", () => {
    const allFiles = files(root);
    const text = new Map(allFiles.map(filename => [filename, readFileSync(filename, "utf8")]));
    const cache = new Map<string, ts.SourceFile>();
    // Only parse reachable browser modules; avoid constructing every server AST.
    const browserEntries = allFiles.filter(filename => /^\s*["']use client["']\s*;?/.test(text.get(filename) || ""));
    // app-api is intentionally a shared browser API even without a directive.
    browserEntries.push(path.join(root, "lib/supabase/app-api.ts"));
    const visited = new Set<string>();
    const violations: string[] = [];
    function walk(filename: string, trail: string[]) {
      if (visited.has(filename)) return;
      visited.add(filename);
      const content = text.get(filename);
      if (content === undefined) return;
      const parsedModule = cache.get(filename) || ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true);
      cache.set(filename, parsedModule);
      for (const specifier of imports(parsedModule)) {
        if (specifier === "server-only") violations.push([...trail, path.relative(root, filename)].join(" -> "));
        const target = resolveLocal(filename, specifier);
        if (target) walk(target, [...trail, path.relative(root, filename)]);
      }
    }
    browserEntries.forEach(filename => walk(filename, []));
    expect(violations).toEqual([]);
  }, 60_000);
});

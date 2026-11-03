import "server-only";

/**
 * Docs access policy:
 * - Local / non-production: on by default
 * - Production: off unless OPENAPI_DOCS_ENABLED is exactly true/1
 * - Explicit false disables everywhere
 */
export function isOpenApiDocsEnabled(): boolean {
  const raw = String(process.env.OPENAPI_DOCS_ENABLED ?? "")
    .trim()
    .toLowerCase();
  if (raw === "false" || raw === "0") return false;
  if (raw === "true" || raw === "1") return true;
  return process.env.NODE_ENV !== "production";
}

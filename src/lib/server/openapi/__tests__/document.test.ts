import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildOpenApiDocument,
  isOpenApiDocsEnabled,
  listRegisteredOpenApiPaths,
  OPENAPI_ROUTE_INVENTORY,
} from "@/lib/server/openapi";

describe("OpenAPI document", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates OpenAPI 3.1 with envelope components and stage domains", () => {
    const doc = buildOpenApiDocument() as {
      openapi: string;
      paths: Record<string, unknown>;
      components?: { schemas?: Record<string, unknown> };
    };
    expect(doc.openapi).toMatch(/^3\.1/);
    expect(doc.paths["/api/auth/login"]).toBeTruthy();
    expect(doc.paths["/api/jobs"]).toBeTruthy();
    expect(doc.paths["/api/payments/init"]).toBeTruthy();
    expect(doc.paths["/api/shop/home"]).toBeTruthy();
    expect(doc.paths["/api/payments/webhooks/flutterwave"]).toBeUndefined();
    expect(doc.paths["/api/jobs/pairing-sweep"]).toBeUndefined();
    expect(doc.components?.schemas?.ApiOkEnvelope).toBeTruthy();
    expect(doc.components?.schemas?.ApiFailEnvelope).toBeTruthy();
  });

  it("lists only inventory stage-target style product paths", () => {
    const paths = listRegisteredOpenApiPaths();
    expect(paths.length).toBeGreaterThanOrEqual(
      OPENAPI_ROUTE_INVENTORY.stageTargets.auth.length,
    );
    for (const p of paths) {
      expect(p.startsWith("/api/")).toBe(true);
    }
  });

  it("enables docs by default outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "");
    expect(isOpenApiDocsEnabled()).toBe(true);
  });

  it("disables docs in production unless explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "");
    expect(isOpenApiDocsEnabled()).toBe(false);
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "true");
    expect(isOpenApiDocsEnabled()).toBe(true);
  });

  it("respects explicit false in any environment", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "false");
    expect(isOpenApiDocsEnabled()).toBe(false);
  });
});

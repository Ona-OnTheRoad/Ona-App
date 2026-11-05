import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/openapi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns 404 when docs disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "false");
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns OpenAPI JSON when enabled", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "true");
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\.1/);
    expect(body.paths["/api/auth/login"]).toBeTruthy();
    expect(body["x-ona-inventory"]).toBeTruthy();
  });
});

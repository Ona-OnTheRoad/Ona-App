import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/docs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns 404 when docs disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "");
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns Swagger HTML when enabled", async () => {
    vi.stubEnv("OPENAPI_DOCS_ENABLED", "true");
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("swagger-ui");
    expect(html).toContain("/api/openapi");
  });
});
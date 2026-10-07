import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { apiFailFromError } from "../api-json";
import { serverLogger } from "../structured-logger";
import { middleware } from "../../../middleware";

describe("request ID middleware", () => {
  it("returns a safe caller ID and generates one for invalid input", () => {
    const supplied = middleware(new NextRequest("https://ona.example/api/jobs", {
      headers: { "x-request-id": "client_req-1" },
    }));
    expect(supplied.headers.get("x-request-id")).toBe("client_req-1");
    expect(supplied.headers.get("x-middleware-request-x-request-id")).toBe("client_req-1");

    const generated = middleware(new NextRequest("https://ona.example/api/jobs", {
      headers: { "x-request-id": "bad id" },
    }));
    expect(generated.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

describe("structured server logging", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits safe JSON fields and omits arbitrary context and error messages", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => {});
    const request = new Request("https://example.test/api/jobs", {
      headers: { "x-request-id": "req_123-safe" },
    });

    serverLogger.error("job.transition.failed", {
      jobId: "job-123",
      operation: "transition",
      authorization: "Bearer secret-token",
      customerEmail: "person@example.test",
    }, request, new Error("provider secret payload"));

    const line = JSON.parse(String(write.mock.calls[0][0]));
    expect(line).toMatchObject({
      level: "error",
      event: "job.transition.failed",
      requestId: "req_123-safe",
      jobId: "job-123",
      operation: "transition",
      errorName: "Error",
    });
    expect(line.authorization).toBeUndefined();
    expect(line.customerEmail).toBeUndefined();
    expect(line.errorMessage).toBeUndefined();
  });

  it("omits untrusted error messages that may contain secrets or personal data", () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => {});
    serverLogger.error("payment.provider.failed", {}, undefined,
      new Error("Bearer abc123 email person@example.test account 12345678901"));
    const line = JSON.parse(String(write.mock.calls[0][0]));
    expect(line.errorMessage).toBeUndefined();
    expect(JSON.stringify(line)).not.toContain("abc123");
    expect(JSON.stringify(line)).not.toContain("person@example.test");
  });

  it("rejects malformed incoming request IDs for logs", () => {
    const write = vi.spyOn(console, "warn").mockImplementation(() => {});
    const request = new Request("https://example.test/api/jobs", {
      headers: { "x-request-id": "bad id\n" },
    });
    serverLogger.warn("job.read.failed", {}, request);
    expect(JSON.parse(String(write.mock.calls[0][0])).requestId).toBeUndefined();
  });
});

describe("apiFailFromError", () => {
  it("keeps a known client error but hides internal 5xx details", async () => {
    const known = apiFailFromError(Object.assign(new Error("Not allowed"), { status: 403, code: "forbidden" }), "Internal failure");
    const internal = apiFailFromError(Object.assign(new Error("db host and password"), { status: 503, code: "db_secret" }), "Service unavailable");

    expect(known.status).toBe(403);
    expect(await known.json()).toMatchObject({ error: { code: "forbidden", message: "Not allowed" } });
    expect(internal.status).toBe(503);
    expect(await internal.json()).toMatchObject({ error: { code: "error", message: "Service unavailable" } });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const KEYS = ["ADMIN_UNLOCK_SIGNING_SECRET", "ADMIN_FIELD_ENCRYPTION_KEY", "ADMIN_SENSITIVE_PASSWORD"];
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
});
afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

describe("admin unlock token signing secret", () => {
  it("refuses to sign in production when no secret is configured (no guessable fallback)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { createUnlockToken } = await import("../sensitive-unlock");
    expect(() => createUnlockToken("admin-1")).toThrow(/ADMIN_UNLOCK_SIGNING_SECRET/);
  });

  it("signs with the configured secret in production and a forged token does not verify", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.ADMIN_UNLOCK_SIGNING_SECRET = "real-secret-value";
    const { createUnlockToken, parseUnlockToken } = await import("../sensitive-unlock");
    const token = createUnlockToken("admin-1");
    expect(parseUnlockToken(token)?.adminId).toBe("admin-1");

    // Attacker re-signs with the old hardcoded literal.
    const { createHmac } = await import("crypto");
    const exp = Date.now() + 60_000;
    const sig = createHmac("sha256", "336699-ogamecho-unlock").update(`admin-1:${exp}`).digest("base64url");
    const forged = Buffer.from(JSON.stringify({ adminId: "admin-1", exp, sig }), "utf8").toString("base64url");
    expect(parseUnlockToken(forged)).toBeNull();
  });

  it("still works without a secret outside production (local dev / tests)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { createUnlockToken, parseUnlockToken } = await import("../sensitive-unlock");
    expect(parseUnlockToken(createUnlockToken("admin-2"))?.adminId).toBe("admin-2");
  });
});

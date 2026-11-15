import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubBankResolve } from "@/test-utils/fake-bank-resolve";

const auth = vi.hoisted(() => ({ userId: null as string | null }));
const ipLimit = vi.hoisted(() => ({
  outcome: { ok: true } as Record<string, unknown>,
  check: vi.fn(),
}));
const userLimit = vi.hoisted(() => ({
  result: { ok: true } as Record<string, unknown>,
  call: vi.fn(),
}));

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(async () =>
    auth.userId
      ? { ok: true, userId: auth.userId }
      : { ok: false, response: new Response("{}", { status: 401 }) },
  ),
}));
vi.mock("@/lib/server/modules/ip-rate-limit", () => ({
  checkIpRateLimit: ipLimit.check,
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: userLimit.call,
  rateLimitUnavailableResponse: () => null,
}));

import { POST } from "../route";

const post = (body: unknown = { accountNumber: "0123456789", bankCode: "058" }) =>
  POST(
    new Request("https://ona.test/api/payments/resolve-account", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  auth.userId = null;
  ipLimit.outcome = { ok: true };
  userLimit.result = { ok: true };
  ipLimit.check.mockImplementation(async () => ipLimit.outcome);
  userLimit.call.mockImplementation(async () => userLimit.result);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("POST /api/payments/resolve-account without a session (signup)", () => {
  it("resolves the name on the per-IP budget", async () => {
    stubBankResolve({ name: "JANE A DOE" });
    const res = await post();
    expect(res.status).toBe(200);
    expect((await res.json()).data.accountName).toBe("JANE A DOE");
    expect(ipLimit.check).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "resolve-account", limit: 10, windowMs: 600_000 }),
    );
    expect(ipLimit.check.mock.calls[0][1].failOpen).toBeFalsy();
    expect(userLimit.call).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After over budget and does not call the bank", async () => {
    const bank = stubBankResolve();
    ipLimit.outcome = { ok: false, reason: "limited", retryAfterSec: 42 };
    const res = await post();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(bank.calls).toHaveLength(0);
  });

  it("fails closed with 503 when the limiter is unavailable", async () => {
    const bank = stubBankResolve();
    ipLimit.outcome = { ok: false, reason: "unavailable" };
    const res = await post();
    expect(res.status).toBe(503);
    expect(bank.calls).toHaveLength(0);
  });
});

describe("POST /api/payments/resolve-account with a session", () => {
  it("uses the per-user budget, not the IP one", async () => {
    stubBankResolve();
    auth.userId = "user-1";
    const res = await post();
    expect(res.status).toBe(200);
    expect(userLimit.call).toHaveBeenCalledWith(
      expect.objectContaining({ key: "resolve-account:user-1", limit: 20 }),
    );
    expect(ipLimit.check).not.toHaveBeenCalled();
  });

  it("returns 429 when the user is over budget", async () => {
    const bank = stubBankResolve();
    auth.userId = "user-1";
    userLimit.result = { ok: false, retryAfterSec: 9 };
    const res = await post();
    expect(res.status).toBe(429);
    expect(bank.calls).toHaveLength(0);
  });
});

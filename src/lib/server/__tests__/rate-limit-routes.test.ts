import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/payments/verify/route";
import { POST as sendOtp } from "@/app/api/auth/otp/send/route";
import { createServiceSupabase } from "@/lib/supabase/server";
import { requireUser } from "../auth-utils";
import { confirmJobPayment } from "../payments/confirm-job-payment";
vi.mock("../auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("../payments/confirm-job-payment", () => ({ confirmJobPayment: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const request = () => new Request("https://ona.test/api/payments/verify", {
  method: "POST", body: JSON.stringify({ reference: "ona_ref" }),
});
describe("verification cannot bypass a failed limiter", () => {
  it("returns 503 and stops before provider/payment work during outages", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("outage"); }));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect((await response.json()).error.code).toBe("rate_limit_unavailable");
    expect(requireUser).not.toHaveBeenCalled();
    expect(confirmJobPayment).not.toHaveBeenCalled();
  });
  it("returns 429 for an exhausted budget before provider/payment work", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ result: [31, 30_000] })));
    expect((await POST(request())).status).toBe(429);
    expect(confirmJobPayment).not.toHaveBeenCalled();
  });
});

describe("OTP preflight HTTP behavior", () => {
  it.each(["outage", "exhausted"])("denies new OTP delivery on %s", async kind => {
    const from = vi.fn((table: string) => {
      expect(table).toBe("profiles");
      return ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: { id: "customer", email: "person@example.test" } })),
    }); });
    vi.mocked(createServiceSupabase).mockReturnValue({ from } as unknown as ReturnType<typeof createServiceSupabase>);
    vi.stubGlobal("fetch", vi.fn(async () => {
      if (kind === "outage") throw new Error("timeout");
      return Response.json({ result: [9, 600_000] });
    }));
    const response = await sendOtp(new Request("https://ona.test/api/auth/otp/send", {
      method: "POST", body: JSON.stringify({ channel: "email", target: "person@example.test" }),
    }));
    expect(response.status).toBe(kind === "outage" ? 503 : 429);
    expect((await response.json()).error.code).toBe(kind === "outage" ? "rate_limit_unavailable" : "rate_limited");
    expect(from.mock.calls.map(call => call[0])).toEqual(["profiles"]);
  });
});

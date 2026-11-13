import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const sms = vi.hoisted(() => ({ send: vi.fn() }));
const limits = vi.hoisted(() => ({ block: null as string | null }));
const sb = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: async ({ key }: { key: string }) =>
    limits.block && key.startsWith(limits.block) ? { ok: false, retryAfterSec: 60 } : { ok: true },
  rateLimitUnavailableResponse: () => null,
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => sb.current }));
vi.mock("@/lib/server/africastalking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/africastalking")>()),
  sendLoginOtpSms: (...args: unknown[]) => sms.send(...args),
}));

import { POST as send } from "../send/route";
import { POST as verify } from "../verify/route";
import { verifyPhoneProof } from "@/lib/server/otp/phone-proof";
import { hashSignupCode, signupOtpKey } from "@/lib/server/otp/signup-otp";

const PHONE = "+2348031234567";
const call = (route: (req: Request) => Promise<Response>, body: Record<string, unknown>) =>
  route(
    new Request("https://ona.test/api/auth/otp/signup/x", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9" },
      body: JSON.stringify(body),
    }),
  );
const otpRows = () => (sb.current as FakeSupabase).rows.phone_otps ?? [];
const seed = (tables: Record<string, Row[]>) => {
  sb.current = new FakeSupabase(tables);
};
const otpRow = (code: string, over: Row = {}): Row => ({
  id: "o1",
  phone: signupOtpKey(PHONE),
  code_hash: hashSignupCode(PHONE, code),
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  attempts: 0,
  consumed_at: null,
  created_at: new Date(Date.now() - 120_000).toISOString(),
  ...over,
});

const ENV = ["AT_USERNAME", "AT_API_KEY", "OTP_PHONE_DEMO_MODE", "NEXT_PUBLIC_APP_URL", "OTP_PROOF_SECRET", "SUPABASE_SERVICE_ROLE_KEY"];
const saved: Record<string, string | undefined> = {};
const goLive = () => {
  process.env.AT_USERNAME = "ona";
  process.env.AT_API_KEY = "key";
  process.env.NEXT_PUBLIC_APP_URL = "https://ona.app";
};

beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  process.env.OTP_PROOF_SECRET = "signup-otp-test";
  vi.stubEnv("NODE_ENV", "production");
  sms.send.mockReset().mockResolvedValue({ ok: true, messageId: "ATX1" });
  limits.block = null;
  seed({ profiles: [], phone_otps: [] });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("POST /api/auth/otp/signup/send", () => {
  it("texts a real random code to a number with no account and stores only its hash", async () => {
    goLive();
    const res = await call(send, { phone: "08031234567" });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({
      sent: true, phone: PHONE, delivery: "sms", resendInSec: 30, expiresInSec: 600,
    });
    const arg = sms.send.mock.calls[0][0] as { to: string; code: string; origin: string };
    expect(arg.to).toBe(PHONE);
    expect(arg.code).toMatch(/^\d{6}$/);
    expect(arg.code).not.toBe("336699");
    expect(arg.origin).toBe("https://ona.app");
    expect(otpRows()).toHaveLength(1);
    expect(JSON.stringify(otpRows())).not.toContain(arg.code);
    // Namespaced: never a plain phone key, so it can not be a login code.
    expect(otpRows()[0].phone).toBe(`signup:${PHONE}`);
  });

  it("refuses a number that already has an account, without sending", async () => {
    goLive();
    seed({ profiles: [{ id: "u1", phone: "+2348031234567" }], phone_otps: [] });
    const res = await call(send, { phone: "0803 123 4567" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_in_use");
    expect(sms.send).not.toHaveBeenCalled();
    expect(otpRows()).toHaveLength(0);
  });

  it("matches an existing account stored in another format (080… vs +234…)", async () => {
    goLive();
    seed({ profiles: [{ id: "u1", phone: "08031234567" }], phone_otps: [] });
    expect((await call(send, { phone: PHONE })).status).toBe(409);
  });

  it("enforces the 30s resend cooldown", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("123456", { created_at: new Date(Date.now() - 5_000).toISOString() })] });
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("resend_wait");
    expect(body.error.message).toMatch(/wait \d+s/i);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("replaces the previous code once the cooldown has passed", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("111111")] });
    expect((await call(send, { phone: PHONE })).status).toBe(200);
    const rows = otpRows();
    expect(rows).toHaveLength(2);
    expect(rows[0].consumed_at).toBeTruthy(); // old code voided
    expect(rows[1].consumed_at).toBeFalsy();
  });

  it("never reports success when the gateway refuses, and voids the unusable code", async () => {
    goLive();
    sms.send.mockResolvedValue({ ok: false, error: "InsufficientBalance", statusCode: 405 });
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("sms_failed");
    expect(otpRows().every((r) => r.consumed_at)).toBe(true);
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("InsufficientBalance");
    expect(logged).not.toContain("2348031234567");
  });

  it("stops at the per-number cap, the per-IP cap and the global daily budget", async () => {
    goLive();
    limits.block = "signup-otp-day:";
    expect((await call(send, { phone: PHONE })).status).toBe(429);
    limits.block = "signup-otp-ip:";
    expect((await call(send, { phone: PHONE })).status).toBe(429);
    limits.block = "signup-otp-budget:";
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("sms_busy");
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("does not spend the daily budget on rejected requests", async () => {
    goLive();
    limits.block = "signup-otp-budget:";
    seed({ profiles: [{ id: "u1", phone: PHONE }], phone_otps: [] });
    expect((await call(send, { phone: PHONE })).status).toBe(409); // not 503
  });

  it("rejects an invalid number", async () => {
    goLive();
    expect((await call(send, { phone: "abc" })).status).toBe(400);
    expect((await call(send, {})).status).toBe(400);
  });

  it("in production without an SMS provider it says so and issues nothing (no dead code boxes)", async () => {
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("sms_unavailable");
    expect(sms.send).not.toHaveBeenCalled();
    expect(otpRows()).toHaveLength(0);
  });

  it("the demo override can NOT make signup codes work in production", async () => {
    process.env.OTP_PHONE_DEMO_MODE = "true";
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(503);
    expect(otpRows()).toHaveLength(0);
  });

  it("does not text a code that could never become a proof (no signing secret)", async () => {
    goLive();
    delete process.env.OTP_PROOF_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("sms_unavailable");
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("answers config problems before touching rate limits or the database", async () => {
    limits.block = "signup-otp-";
    seed({ profiles: [{ id: "u1", phone: PHONE }], phone_otps: [] });
    // Unavailable (not 429 / 409): decided from configuration alone.
    expect((await call(send, { phone: PHONE })).status).toBe(503);
  });

  it("in development (no SMS provider) issues the demo code so the flow can be built", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await call(send, { phone: PHONE });
    expect(res.status).toBe(200);
    expect((await res.json()).data.delivery).toBe("demo");
    expect(sms.send).not.toHaveBeenCalled();
    expect(otpRows()).toHaveLength(1);
  });
});

describe("POST /api/auth/otp/signup/verify", () => {
  it("accepts the right code and returns a proof for that exact number only", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    const res = await call(verify, { phone: "08031234567", code: "482913" });
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data).toMatchObject({ verified: true, phone: PHONE, proofExpiresInSec: 7200 });
    expect(verifyPhoneProof(data.proof, PHONE)).toBe(true);
    expect(verifyPhoneProof(data.proof, "+2348039999999")).toBe(false);
    expect(otpRows()[0].consumed_at).toBeTruthy();
  });

  it("does not create a session or any account data", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    const data = (await (await call(verify, { phone: PHONE, code: "482913" })).json()).data;
    expect(Object.keys(data).sort()).toEqual(["phone", "proof", "proofExpiresInSec", "verified"]);
    expect((sb.current as FakeSupabase).rows.profiles).toHaveLength(0);
  });

  it("rejects a wrong code, counts the attempt and gives no proof", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    const res = await call(verify, { phone: PHONE, code: "000000" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("otp_invalid");
    expect(body.data?.proof).toBeUndefined();
    expect(otpRows()[0].attempts).toBe(1);
    expect(otpRows()[0].consumed_at).toBeFalsy();
  });

  it("locks the code after five wrong guesses, even if the next guess is right", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913", { attempts: 5 })] });
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(429);
    expect((await res.json()).error.code).toBe("otp_locked");
    expect(otpRows()[0].consumed_at).toBeTruthy();
  });

  it("rejects an expired code", async () => {
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913", { expires_at: new Date(Date.now() - 1000).toISOString() })] });
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_expired");
  });

  it("rejects when no code was ever requested", async () => {
    goLive();
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_missing");
  });

  it("cannot be satisfied by a LOGIN code for the same number", async () => {
    goLive();
    seed({
      profiles: [],
      phone_otps: [{ ...otpRow("482913"), phone: PHONE }], // plain phone key = login namespace
    });
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_missing");
  });

  it("refuses if the number was registered after the code was sent", async () => {
    goLive();
    seed({ profiles: [{ id: "u1", phone: PHONE }], phone_otps: [otpRow("482913")] });
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_in_use");
  });

  it("never lets the demo code mint a proof in production, before or after go-live", async () => {
    // Before go-live (no SMS provider): used to be the dangerous case.
    const before = await call(verify, { phone: PHONE, code: "336699" });
    expect(before.status).toBe(400);
    expect((await before.json()).error.code).toBe("otp_missing");
    // Even with the emergency override on.
    process.env.OTP_PHONE_DEMO_MODE = "true";
    expect((await call(verify, { phone: PHONE, code: "336699" })).status).toBe(400);
    delete process.env.OTP_PHONE_DEMO_MODE;
    // Live, with a real code issued.
    goLive();
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    expect((await call(verify, { phone: PHONE, code: "336699" })).status).toBe(401);
  });

  it("accepts the demo code in development only", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await call(verify, { phone: PHONE, code: "336699" });
    expect(res.status).toBe(200);
    expect(verifyPhoneProof((await res.json()).data.proof, PHONE)).toBe(true);
  });

  it("fails closed (503) if a proof cannot be signed", async () => {
    goLive();
    delete process.env.OTP_PROOF_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    const res = await call(verify, { phone: PHONE, code: "482913" });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("proof_unavailable");
  });

  it("rate limits attempts per IP", async () => {
    goLive();
    limits.block = "signup-otp-verify-ip:";
    seed({ profiles: [], phone_otps: [otpRow("482913")] });
    expect((await call(verify, { phone: PHONE, code: "482913" })).status).toBe(429);
  });
});

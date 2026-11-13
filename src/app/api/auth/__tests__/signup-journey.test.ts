/**
 * End-to-end signup journeys through the REAL route handlers, sharing one
 * in-memory database:
 *
 *   POST /api/auth/otp/signup/send   -> code "delivered" (captured here)
 *   POST /api/auth/otp/signup/verify -> signed phone proof
 *   POST /api/auth/signup            -> account (+ phone verified when the proof is valid)
 *   POST /api/auth/otp/send          -> login code for the new account
 *
 * Only the outside world is faked: SMS/email delivery (the code a user would
 * receive is captured), Supabase auth, the rate-limit store and ID providers.
 * These tests exist because each route is unit-tested alone; this file proves
 * the seams between them (proof signing, number canonicalisation, namespaces,
 * duplicate checks across the whole journey).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type AuthResult, type Row } from "@/test-utils/fake-supabase";

const h = vi.hoisted(() => ({
  db: null as unknown,
  deliver: vi.fn(),
  signIn: vi.fn(),
  getUser: vi.fn(),
  createUser: vi.fn(),
  sendMail: vi.fn(),
  limits: { block: null as string | null, calls: [] as string[] },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: h.getUser, signInWithPassword: h.signIn } }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => h.db }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "https://example.test",
  getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: async ({ key }: { key: string }) => {
    h.limits.calls.push(key);
    return h.limits.block && key.startsWith(h.limits.block)
      ? { ok: false, retryAfterSec: 60 }
      : { ok: true };
  },
  rateLimitUnavailableResponse: () => null,
}));
vi.mock("@/lib/server/auth/otp-delivery", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/auth/otp-delivery")>()),
  deliverOtp: (...a: unknown[]) => h.deliver(...a),
}));
vi.mock("@/lib/server/resend", () => ({
  sendSignupConfirmationEmail: h.sendMail,
  isResendConfigured: () => false,
  sendResendEmail: vi.fn(),
}));
vi.mock("@/lib/server/identity/identity-sync", () => ({
  runIdentitySync: vi.fn(async () => undefined),
  detectMergeCandidatesForUser: vi.fn(async () => undefined),
}));
// Login-code issuing is ledger-idempotent; the ledger is not what is under test.
vi.mock("@/lib/server/idempotency", () => ({
  runIdempotent: async (o: {
    beforeRun?: () => Promise<void>;
    run: () => Promise<{ ok: boolean; result?: unknown; error?: string }>;
  }) => {
    await o.beforeRun?.();
    const r = await o.run();
    return r.ok ? { status: "done", result: r.result } : { status: "error", error: r.error };
  },
}));

import { POST as signupSend } from "../otp/signup/send/route";
import { POST as signupVerify } from "../otp/signup/verify/route";
import { POST as signup } from "../signup/route";
import { POST as loginSend } from "../otp/send/route";
import { issuePhoneProof } from "@/lib/server/otp/phone-proof";

const PHONE = "+2348012345678";
const EMAIL = "ada@ona.test";
const PASSWORD = "Strong#Pass1";

type Db = FakeSupabase;
const db = () => h.db as Db;
const rows = (t: string): Row[] => (db().rows[t] ?? []) as Row[];

function newDb(tables: Record<string, Row[]> = {}) {
  const sb = new FakeSupabase({ profiles: [], phone_otps: [], ...tables }) as Db;
  (sb as unknown as { auth: unknown }).auth = {
    admin: {
      createUser: (i: Record<string, unknown>) => h.createUser(i),
      getUserById: async (id: string) => ({ data: { user: { id, email: EMAIL } }, error: null }),
    },
    signInWithPassword: (i: Record<string, unknown>) => h.signIn(i),
  };
  h.db = sb;
}

const session = (id = "user-1"): AuthResult => ({
  data: { user: { id }, session: { access_token: `at-${id}`, refresh_token: "rt", expires_at: 1 } },
  error: null,
});

const post = (route: (r: Request) => Promise<Response>, path: string, body: unknown, ip = "9.9.9.9") =>
  route(
    new Request(`https://ona.test${path}`, {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );
/** Postgres fills phone_otps.created_at (DEFAULT now()); the in-memory fake does not, so emulate it. */
const stampDbDefaults = () => {
  for (const r of rows("phone_otps")) if (!r.created_at) r.created_at = new Date().toISOString();
};
const sendCode = async (phone = PHONE, ip?: string) => {
  const res = await post(signupSend, "/api/auth/otp/signup/send", { phone }, ip);
  stampDbDefaults();
  return res;
};
const verifyCode = (code: string, phone = PHONE, ip?: string) =>
  post(signupVerify, "/api/auth/otp/signup/verify", { phone, code }, ip);

const motorist = (extra: Record<string, unknown> = {}) => ({
  email: EMAIL, password: PASSWORD, fullName: "Ada User", phone: PHONE, accountType: "motorist",
  gender: "female", dateOfBirth: "1990-05-05", city: "Lagos", area: "Yaba",
  vehicleMake: "Toyota", vehicleModel: "Corolla", ...extra,
});
const pro = (extra: Record<string, unknown> = {}) => ({
  email: EMAIL, password: PASSWORD, fullName: "Ada User", phone: PHONE, accountType: "professional",
  gender: "female", dateOfBirth: "1990-05-05", city: "Lagos", area: "Yaba", businessName: "Ada Autos",
  primaryService: "mechanic", services: ["mechanic"], bio: "Engine work", yearsExperience: "5",
  guarantor: { fullName: "Bola Guarantor", phone: "+2348098765432", relationship: "Brother" }, ...extra,
});
const createAccount = (body: Record<string, unknown>) => post(signup, "/api/auth/signup", body);

/** Code the user would have received by SMS for the latest delivery. */
const lastCode = () => {
  const calls = h.deliver.mock.calls;
  return String((calls[calls.length - 1]?.[0] as { code: string }).code);
};
/** Make the latest stored code old enough to pass the resend cooldown. */
const ageLatestCode = (ms = 120_000) => {
  const all = rows("phone_otps");
  all[all.length - 1].created_at = new Date(Date.now() - ms).toISOString();
};
/** Run send+verify and return the proof (asserts both succeed). */
async function getProof(phone = PHONE): Promise<string> {
  expect((await sendCode(phone)).status).toBe(200);
  const res = await verifyCode(lastCode(), phone);
  expect(res.status).toBe(200);
  const proof = (await res.json()).data.proof as string;
  expect(proof).toBeTruthy();
  return proof;
}

const ENV = ["AT_USERNAME", "AT_API_KEY", "OTP_DEMO_MODE", "NEXT_PUBLIC_OTP_DEMO_MODE", "OTP_PROOF_SECRET",
  "OTP_SIGNUP_DAILY_BUDGET", "NEXT_PUBLIC_APP_URL", "TERMII_API_KEY", "TERMII_SENDER_ID", "TERMII_BASE_URL"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.AT_USERNAME = "ona";
  process.env.AT_API_KEY = "key";
  process.env.OTP_PROOF_SECRET = "journey-secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://ona.app";
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
  h.deliver.mockReset().mockResolvedValue({ ok: true });
  h.signIn.mockReset().mockResolvedValue(session());
  h.getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1", email: EMAIL } }, error: null });
  h.createUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1", email: EMAIL } }, error: null });
  h.sendMail.mockReset().mockResolvedValue({ ok: true });
  h.limits.block = null;
  h.limits.calls = [];
  newDb();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

describe("happy path: verify the number, then sign up", () => {
  it("customer: code -> proof -> account created with the phone marked verified, then the number can log in", async () => {
    const proof = await getProof();

    // The SMS carried a real random code and the WebOTP origin, never the demo code.
    const sent = h.deliver.mock.calls[0][0] as { channel: string; to: string; code: string; origin: string };
    expect(sent).toMatchObject({ channel: "phone", to: PHONE, origin: "https://ona.app" });
    expect(sent.code).toMatch(/^\d{6}$/);
    expect(sent.code).not.toBe("336699");

    const res = await createAccount(motorist({ phoneProof: proof }));
    expect(res.status).toBe(200);
    const body = (await res.json()).data;
    expect(body).toMatchObject({ userId: "user-1", createdNew: true, role: "motorist", session: { access_token: "at-user-1" } });
    expect(body.extras.phoneVerified).toBe(true);
    expect(rows("profiles")[0]).toMatchObject({ id: "user-1", phone: PHONE, phone_verified: true });
    expect(rows("motorist_profiles")[0]).toMatchObject({ phone_verified: true });

    // The code is single-use: nothing active is left for this number.
    expect(rows("phone_otps").filter((r) => !r.consumed_at)).toHaveLength(0);

    // Login seam: the stored canonical number is found whatever format the user types.
    for (const typed of ["08012345678", "2348012345678", "+234 801 234 5678", "0801-234-5678"]) {
      h.deliver.mockClear();
      db().rows.phone_otps = [];
      const login = await post(loginSend, "/api/auth/otp/send", { channel: "phone", target: typed });
      expect(login.status, `login code for "${typed}"`).toBe(200);
      expect(h.deliver).toHaveBeenCalledWith(expect.objectContaining({ channel: "phone", to: PHONE }));
    }
  });

  it("Repair Pro: same journey, pro tables stamped verified", async () => {
    const proof = await getProof();
    const res = await createAccount(pro({ phoneProof: proof }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(true);
    expect(rows("repair_pro_profiles")[0]).toMatchObject({ user_id: "user-1", phone_verified: true });
  });

  it("number typed in a different format at signup still matches the proof", async () => {
    const proof = await getProof("0801 234 5678");
    const res = await createAccount(motorist({ phone: "08012345678", phoneProof: proof }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(true);
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("skipping verification still creates the account, unverified", async () => {
    const res = await createAccount(motorist());
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(false);
    expect(rows("profiles")[0].phone_verified).toBeUndefined();
  });
});

describe("wrong, expired and abused codes", () => {
  it("5 wrong guesses lock the code, even the right one is then refused until a new code is sent", async () => {
    expect((await sendCode()).status).toBe(200);
    const good = lastCode();
    const wrong = good === "111111" ? "222222" : "111111";
    for (let i = 1; i <= 4; i++) {
      const r = await verifyCode(wrong);
      expect(r.status).toBe(401);
      expect((await r.json()).error.code).toBe("otp_invalid");
    }
    const fifth = await verifyCode(wrong);
    expect(fifth.status).toBe(401);
    expect((await fifth.json()).error.message).toMatch(/too many/i);
    // Locked: the genuine code no longer works.
    const afterLock = await verifyCode(good);
    expect([400, 429]).toContain(afterLock.status);
    expect((await afterLock.json()).error.code).toMatch(/otp_locked|otp_missing/);

    // Fresh code works.
    ageLatestCode();
    expect((await sendCode()).status).toBe(200);
    expect((await verifyCode(lastCode())).status).toBe(200);
  });

  it("an expired code is refused and consumed", async () => {
    expect((await sendCode()).status).toBe(200);
    const code = lastCode();
    rows("phone_otps")[0].expires_at = new Date(Date.now() - 1000).toISOString();
    const res = await verifyCode(code);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_expired");
    expect(rows("phone_otps")[0].consumed_at).toBeTruthy();
  });

  it("a code cannot be used twice", async () => {
    expect((await sendCode()).status).toBe(200);
    const code = lastCode();
    expect((await verifyCode(code)).status).toBe(200);
    const again = await verifyCode(code);
    expect(again.status).toBe(400);
    expect((await again.json()).error.code).toBe("otp_missing");
  });

  it("a code sent to one number cannot verify another", async () => {
    expect((await sendCode()).status).toBe(200);
    const res = await verifyCode(lastCode(), "+2348099999999");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_missing");
  });

  it("resend is blocked inside the cooldown and allowed after it, and the old code stops working", async () => {
    expect((await sendCode()).status).toBe(200);
    const first = lastCode();
    const tooSoon = await sendCode();
    expect(tooSoon.status).toBe(429);
    expect((await tooSoon.json()).error.code).toBe("resend_wait");
    ageLatestCode();
    expect((await sendCode()).status).toBe(200);
    const second = lastCode();
    if (first !== second) expect((await verifyCode(first)).status).toBe(401);
    expect((await verifyCode(second)).status).toBe(200);
  });

  it("the demo code never mints a proof in production, even with the demo flags on", async () => {
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    // No provider + demo on: signup-time verification is unavailable, never faked.
    const send = await sendCode();
    expect(send.status).toBe(503);
    expect((await send.json()).error.code).toBe("sms_unavailable");
    const v = await verifyCode("336699");
    expect(v.status).toBe(400);
    // ...and signup still works, unverified.
    const res = await createAccount(motorist());
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(false);
  });

  it("a login-namespace code cannot mint a signup proof", async () => {
    // A valid-looking login code for the same number sits in phone_otps under the plain key.
    const { createHash } = await import("node:crypto");
    rows("phone_otps").push({
      id: "login-1", phone: PHONE, consumed_at: null,
      code_hash: createHash("sha256").update(`${PHONE}:123456:`).digest("hex"),
      expires_at: new Date(Date.now() + 600_000).toISOString(), attempts: 0,
      created_at: new Date(Date.now() - 120_000).toISOString(),
    });
    const res = await verifyCode("123456");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("otp_missing");
  });
});

describe("proof integrity across the journey", () => {
  it("a proof for another number is ignored: account created, unverified", async () => {
    const proof = await getProof("+2348099999999");
    const res = await createAccount(motorist({ phoneProof: proof }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(false);
  });

  it("changing the number after verifying drops verification (proof is number-bound)", async () => {
    const proof = await getProof();
    const res = await createAccount(motorist({ phone: "+2348077777777", phoneProof: proof }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(false);
    expect(rows("profiles")[0].phone).toBe("+2348077777777");
  });

  it("an expired proof and a tampered proof are ignored, not errors", async () => {
    const stale = issuePhoneProof(PHONE, Date.now() - 3 * 60 * 60 * 1000).proof;
    const good = issuePhoneProof(PHONE).proof;
    for (const p of [stale, good.slice(0, -3) + "AAA", "garbage"]) {
      newDb();
      const res = await createAccount(motorist({ phoneProof: p }));
      expect(res.status).toBe(200);
      expect((await res.json()).data.extras.phoneVerified).toBe(false);
    }
  });

  it("a proof signed with a different secret is rejected (rotated or forged)", async () => {
    const proof = await getProof();
    process.env.OTP_PROOF_SECRET = "rotated-secret";
    const res = await createAccount(motorist({ phoneProof: proof }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.extras.phoneVerified).toBe(false);
  });

  it("replaying a proof cannot create a second account on the same number", async () => {
    const proof = await getProof();
    expect((await createAccount(motorist({ phoneProof: proof }))).status).toBe(200);
    h.createUser.mockResolvedValue({ data: { user: { id: "user-2", email: "other@ona.test" } }, error: null });
    const replay = await createAccount(motorist({ email: "other@ona.test", phoneProof: proof }));
    expect(replay.status).toBe(409);
    expect((await replay.json()).error.code).toBe("phone_exists");
    expect(rows("profiles")).toHaveLength(1);
  });
});

describe("a number that already has an account", () => {
  const owner = { id: "owner", email: "owner@ona.test", phone: PHONE, role: "motorist", is_active: true };

  it("cannot be sent a signup code", async () => {
    newDb({ profiles: [owner] });
    const res = await sendCode();
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_in_use");
    expect(h.deliver).not.toHaveBeenCalled();
  });

  it("is caught at verify if somebody registered it after the code was sent", async () => {
    expect((await sendCode()).status).toBe(200);
    const code = lastCode();
    rows("profiles").push(owner);
    const res = await verifyCode(code);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_in_use");
  });

  it("is caught at signup if somebody registered it after verification; no account is created", async () => {
    const proof = await getProof();
    rows("profiles").push(owner);
    const res = await createAccount(motorist({ phoneProof: proof }));
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("phone_exists");
    expect(h.createUser).not.toHaveBeenCalled();
    expect(rows("profiles")).toHaveLength(1);
  });

  it.each(["08012345678", "2348012345678", "0801 234 5678", "+234 801-234-5678"])(
    "is detected however the owner stored it (%s)",
    async (stored) => {
      newDb({ profiles: [{ ...owner, phone: stored }] });
      expect((await sendCode()).status).toBe(409);
    },
  );
});

describe("providers, budgets and limits", () => {
  it("SMS gateway failure: honest 502, nothing usable stored, retry then succeeds", async () => {
    h.deliver.mockResolvedValueOnce({ ok: false, error: "gateway down" });
    const fail = await sendCode();
    expect(fail.status).toBe(502);
    expect((await fail.json()).error.code).toBe("sms_failed");
    expect(rows("phone_otps").filter((r) => !r.consumed_at)).toHaveLength(0);
    // The log has the cause, never the code or the full number.
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("gateway down");
    expect(logged).not.toContain("2348012345678");

    ageLatestCode();
    h.deliver.mockResolvedValue({ ok: true });
    expect((await sendCode()).status).toBe(200);
    expect((await verifyCode(lastCode())).status).toBe(200);
  });

  it("no SMS provider and no demo: unavailable (503), signup itself is never blocked", async () => {
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    const send = await sendCode();
    expect(send.status).toBe(503);
    expect(h.deliver).not.toHaveBeenCalled();
    expect((await createAccount(motorist())).status).toBe(200);
  });

  it("the second SMS provider alone is enough to offer verification", async () => {
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    process.env.TERMII_API_KEY = "t-key";
    process.env.TERMII_SENDER_ID = "ONA";
    process.env.TERMII_BASE_URL = "https://termii.example.test";
    const send = await sendCode();
    expect(send.status).toBe(200);
    expect(h.deliver).toHaveBeenCalledTimes(1);
    delete process.env.TERMII_SENDER_ID;
    delete process.env.TERMII_BASE_URL;
  });

  it("global daily SMS budget exhausted: 503 sms_busy, no SMS sent, signup still possible", async () => {
    h.limits.block = "signup-otp-budget:";
    const res = await sendCode();
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("sms_busy");
    expect(h.deliver).not.toHaveBeenCalled();
    expect((await createAccount(motorist())).status).toBe(200);
  });

  it("per-IP and per-number caps return 429 before any SMS is spent", async () => {
    h.limits.block = "signup-otp-ip:";
    expect((await sendCode()).status).toBe(429);
    h.limits.block = "signup-otp-day:";
    expect((await sendCode()).status).toBe(429);
    expect(h.deliver).not.toHaveBeenCalled();
  });

  it("verify attempts are rate limited per IP", async () => {
    h.limits.block = "signup-otp-verify-ip:";
    expect((await verifyCode("123456")).status).toBe(429);
  });

  it("signup submissions are rate limited per IP and create nothing when blocked", async () => {
    h.limits.block = "signup:ip:";
    const res = await createAccount(motorist());
    expect(res.status).toBe(429);
    expect(h.createUser).not.toHaveBeenCalled();
  });
});

describe("input validation along the journey", () => {
  it.each([["", "empty"], ["123", "too short"], ["abcdefghij", "letters"]])(
    "send rejects an invalid phone (%s: %s)",
    async (phone) => {
      const res = await sendCode(phone);
      expect(res.status).toBe(400);
      expect(h.deliver).not.toHaveBeenCalled();
    },
  );

  it.each(["", "12", "abcdef"])("verify rejects a malformed code (%s)", async (code) => {
    expect((await verifyCode(code)).status).toBe(400);
  });

  it("signup rejects a missing/invalid body without touching the database", async () => {
    expect((await createAccount({})).status).toBe(400);
    expect(h.createUser).not.toHaveBeenCalled();
  });

  it("signup refuses an under-age date of birth and a future date", async () => {
    const tooYoung = new Date(Date.now() - 10 * 365 * 24 * 3600_000).toISOString().slice(0, 10);
    const future = new Date(Date.now() + 365 * 24 * 3600_000).toISOString().slice(0, 10);
    for (const dateOfBirth of [tooYoung, future]) {
      const res = await createAccount(motorist({ dateOfBirth }));
      expect(res.status).toBe(400);
    }
    expect(h.createUser).not.toHaveBeenCalled();
  });

  it("email already registered: 409 and nothing is overwritten", async () => {
    newDb({ profiles: [{ id: "user-1", email: EMAIL, phone: "+2348055555555", role: "motorist", full_name: "Original", is_active: true }] });
    h.createUser.mockResolvedValue({ data: { user: null }, error: { message: "User already registered", status: 422 } });
    const res = await createAccount(motorist({ phone: "+2348066666666", fullName: "Hijack" }));
    expect(res.status).toBe(409);
    expect(rows("profiles")[0]).toMatchObject({ full_name: "Original", phone: "+2348055555555" });
  });
});

describe("resilience", () => {
  it("auth session failure after account creation still returns success with a warning", async () => {
    h.signIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: "boom" } });
    const res = await createAccount(motorist());
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data.session).toBeNull();
    expect(data.warning).toMatch(/logging in/i);
  });

  it("confirmation email failure never blocks signup", async () => {
    h.sendMail.mockResolvedValue({ ok: false, error: "resend down" });
    const res = await createAccount(motorist());
    expect(res.status).toBe(200);
    expect((await res.json()).data.emailSent).toBe(false);
  });

  it("a failed phone-owner lookup fails closed: no account created", async () => {
    const original = (h.db as Db).from.bind(h.db);
    (h.db as Db).from = ((table: string) => {
      const q = original(table) as unknown as { or: (r: string) => unknown; then: (a: (v: unknown) => void, b: (e: unknown) => void) => void; fail?: boolean };
      const or = q.or.bind(q);
      const then = q.then.bind(q);
      q.or = (raw: string) => { if (raw.includes("phone")) q.fail = true; return or(raw); };
      q.then = (res, rej) => (q.fail ? res({ data: null, error: { message: "db down" } }) : then(res, rej));
      return q as never;
    }) as never;
    const res = await createAccount(motorist());
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("phone_check_failed");
    expect(h.createUser).not.toHaveBeenCalled();
  });
});

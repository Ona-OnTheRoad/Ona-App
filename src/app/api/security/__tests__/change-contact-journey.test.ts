/**
 * Change phone / change email from Settings, end to end through the REAL handlers
 * sharing one in-memory database:
 *
 *   POST /api/auth/otp/send                       code to the CURRENT email (identity step)
 *   POST /api/security/verify-identity            password + code (+ guarantor if on file) -> identityProof
 *   POST /api/security/change-contact/send-code   code to the NEW phone/email (needs the proof)
 *   POST /api/security/action                     change_phone / change_email (needs proof + code)
 *
 * Only the outside world is faked: SMS/email delivery (the code a user would
 * receive is captured), Supabase auth, the rate-limit store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const h = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  return {
    db: null as unknown,
    deliver: vi.fn(),
    passwordOk: true,
    limits: { block: null as string | null },
    users: {
      "tok-user-1": { id: "user-1", email: "ada@ona.test" },
      "tok-user-2": { id: "user-2", email: "bola@ona.test" },
    } as Record<string, { id: string; email: string }>,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => {
        const user = h.users[token];
        return user ? { data: { user }, error: null } : { data: { user: null }, error: { message: "bad token" } };
      },
      signInWithPassword: async () =>
        h.passwordOk ? { data: { user: {}, session: {} }, error: null } : { data: null, error: { message: "Invalid login" } },
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => h.db }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "https://example.test",
  getSupabaseAnonKey: () => "anon",
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: async ({ key }: { key: string }) =>
    h.limits.block && key.startsWith(h.limits.block) ? { ok: false, retryAfterSec: 60 } : { ok: true },
  rateLimitUnavailableResponse: () => null,
}));
vi.mock("@/lib/server/auth/otp-delivery", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/auth/otp-delivery")>()),
  deliverOtp: (...a: unknown[]) => h.deliver(...a),
}));
vi.mock("@/lib/server/resend", () => ({
  isResendConfigured: () => true,
  sendResendEmail: vi.fn(),
  sendSignupConfirmationEmail: vi.fn(),
}));
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
vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => undefined) }));

import { POST as loginSend } from "@/app/api/auth/otp/send/route";
import { POST as verifyIdentity } from "../verify-identity/route";
import { POST as sendCode } from "../change-contact/send-code/route";
import { POST as action } from "../action/route";
import { issueIdentityProof, IDENTITY_PROOF_TTL_MS } from "@/lib/server/otp/identity-proof";

const PHONE = "+2348012345678";
const NEW_PHONE = "+2348077777777";
const EMAIL = "ada@ona.test";
const NEW_EMAIL = "ada.new@ona.test";
const TOKEN = "tok-user-1";

const db = () => h.db as FakeSupabase;
const rows = (t: string): Row[] => (db().rows[t] ?? []) as Row[];

function newDb(extra: Record<string, Row[]> = {}) {
  const sb = new FakeSupabase({
    profiles: [
      { id: "user-1", email: EMAIL, phone: PHONE, role: "motorist", is_active: true, phone_verified: false },
      { id: "user-2", email: "bola@ona.test", phone: "+2348099999999", role: "motorist", is_active: true },
    ],
    motorist_profiles: [{ user_id: "user-1", phone: PHONE }],
    repair_pro_profiles: [],
    repair_pro_guarantors: [],
    phone_otps: [],
    profile_audit_log: [],
    ...extra,
  });
  (sb as unknown as { auth: unknown }).auth = {
    getUser: async (token: string) => {
      const user = h.users[token];
      return { data: { user: user ?? null }, error: user ? null : { message: "bad" } };
    },
    admin: { updateUserById: async () => ({ data: {}, error: null }) },
  };
  h.db = sb;
}

const call = (route: (r: Request) => Promise<Response>, path: string, body: unknown, token: string | null = TOKEN) =>
  route(
    new Request(`https://ona.test${path}`, {
      method: "POST",
      headers: {
        "x-forwarded-for": "9.9.9.9",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );

/** Postgres fills created_at (DEFAULT now()); the in-memory fake does not. */
const stamp = () => {
  for (const r of rows("phone_otps")) if (!r.created_at) r.created_at = new Date().toISOString();
};
const lastCode = () => {
  const c = h.deliver.mock.calls;
  return String((c[c.length - 1][0] as { code: string }).code);
};
const ageLatestCode = () => {
  const all = rows("phone_otps");
  all[all.length - 1].created_at = new Date(Date.now() - 120_000).toISOString();
};

/** Identity step: email code to the CURRENT email, then password + code. Returns the proof. */
async function passIdentity(token = TOKEN, extra: Record<string, unknown> = {}): Promise<string> {
  const email = h.users[token].email;
  const sent = await call(loginSend, "/api/auth/otp/send", { channel: "email", target: email }, null);
  expect(sent.status).toBe(200);
  stamp();
  const res = await call(verifyIdentity, "/api/security/verify-identity", {
    accessToken: token, password: "Strong#Pass1", emailCode: lastCode(), ...extra,
  }, null);
  expect(res.status).toBe(200);
  const proof = (await res.json()).data.identityProof as string;
  expect(proof).toBeTruthy();
  return proof;
}
const sendNew = async (channel: "phone" | "email", target: string, identityProof: string, token: string | null = TOKEN) => {
  const res = await call(sendCode, "/api/security/change-contact/send-code", { channel, target, identityProof }, token);
  stamp();
  return res;
};
const change = (act: "change_phone" | "change_email", newValue: string, extra: Record<string, unknown>, token = TOKEN) =>
  call(action, "/api/security/action", { action: act, accessToken: token, newValue, ...extra }, null);
const errCode = async (res: Response) => (await res.json()).error?.code as string;

const ENV = ["AT_USERNAME", "AT_API_KEY", "OTP_DEMO_MODE", "NEXT_PUBLIC_OTP_DEMO_MODE", "OTP_PROOF_SECRET", "NEXT_PUBLIC_APP_URL"];
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.AT_USERNAME = "ona";
  process.env.AT_API_KEY = "key";
  process.env.OTP_PROOF_SECRET = "change-contact-secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://ona.app";
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
  h.deliver.mockReset().mockResolvedValue({ ok: true });
  h.passwordOk = true;
  h.limits.block = null;
  newDb();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

describe("happy paths", () => {
  it("customer (no guarantor) changes phone: identity -> code to the new number -> updated and verified", async () => {
    const proof = await passIdentity();

    expect((await sendNew("phone", "0807 777 7777", proof)).status).toBe(200);
    const sms = h.deliver.mock.calls[h.deliver.mock.calls.length - 1][0] as Record<string, unknown>;
    expect(sms).toMatchObject({ channel: "phone", to: NEW_PHONE, purpose: "verify", origin: "https://ona.app" });
    expect(String(sms.code)).toMatch(/^\d{6}$/);
    expect(sms.code).not.toBe("336699");
    // Only a hash is stored, in a namespace bound to this user and this exact number.
    const stored = rows("phone_otps").filter((r) => String(r.phone).startsWith("change:"));
    expect(stored).toHaveLength(1);
    expect(stored[0].phone).toBe(`change:user-1:${NEW_PHONE}`);
    expect(JSON.stringify(stored)).not.toContain(String(sms.code));

    const res = await change("change_phone", "08077777777", { code: String(sms.code), identityProof: proof });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ updated: true });
    expect(rows("profiles")[0]).toMatchObject({ phone: NEW_PHONE, phone_verified: true });
    expect(rows("motorist_profiles")[0].phone).toBe(NEW_PHONE);
    expect(rows("profile_audit_log")[0]).toMatchObject({ action_type: "change_phone", status: "completed" });
    // The code is single-use.
    expect(rows("phone_otps").filter((r) => String(r.phone).startsWith("change:") && !r.consumed_at)).toHaveLength(0);
  });

  it("changes email: identity -> code to the new email (verification wording) -> updated", async () => {
    const proof = await passIdentity();
    expect((await sendNew("email", "Ada.New@Ona.test", proof)).status).toBe(200);
    const mail = h.deliver.mock.calls[h.deliver.mock.calls.length - 1][0] as Record<string, unknown>;
    expect(mail).toMatchObject({ channel: "email", to: NEW_EMAIL, purpose: "verify" });

    const res = await change("change_email", "ADA.NEW@ona.test", { code: String(mail.code), identityProof: proof });
    expect(res.status).toBe(200);
    expect(rows("profiles")[0].email).toBe(NEW_EMAIL);
  });

  it("Repair Pro with a guarantor on file must give the matching name", async () => {
    newDb({ repair_pro_guarantors: [{ user_id: "user-1", full_name: "Bola Guarantor" }] });
    // wrong name
    await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    stamp();
    const code = lastCode();
    const bad = await call(verifyIdentity, "/api/security/verify-identity", {
      accessToken: TOKEN, password: "Strong#Pass1", emailCode: code, guarantorName: "Someone Else",
    }, null);
    expect(bad.status).toBe(403);
    // missing name
    await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    ageLatestCode();
    const missing = await passIdentityRaw({});
    expect(missing.status).toBe(400);
    // right name (case/space-insensitive)
    const ok = await passIdentityRaw({ guarantorName: "  bola guarantor " });
    expect(ok.status).toBe(200);
    expect((await ok.json()).data.identityProof).toBeTruthy();
  });
});

/** Sends a fresh code to the current email and submits verify-identity with the given extras. */
async function passIdentityRaw(extra: Record<string, unknown>) {
  ageLatestCode();
  await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
  stamp();
  return call(verifyIdentity, "/api/security/verify-identity", {
    accessToken: TOKEN, password: "Strong#Pass1", emailCode: lastCode(), ...extra,
  }, null);
}

describe("the server enforces the proof and the code (the browser cannot skip them)", () => {
  it("rejects a change with no identity proof, and does not touch the profile", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const res = await change("change_phone", NEW_PHONE, { code: lastCode() });
    expect(res.status).toBe(403);
    expect(await errCode(res)).toBe("identity_required");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("rejects a change with no code", async () => {
    const proof = await passIdentity();
    const res = await change("change_phone", NEW_PHONE, { identityProof: proof });
    expect(res.status).toBe(400);
    expect(await errCode(res)).toBe("code_required");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("rejects a change when no code was ever sent to that contact", async () => {
    const proof = await passIdentity();
    const res = await change("change_phone", NEW_PHONE, { code: "123456", identityProof: proof });
    expect(res.status).toBe(400);
    expect(await errCode(res)).toBe("otp_missing");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("the demo code does not authorise a change in production", async () => {
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const res = await change("change_phone", NEW_PHONE, { code: "336699", identityProof: proof });
    expect(res.status).toBe(401);
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("a wrong code is refused and counted; 5 wrong guesses lock it, even the right code then fails", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const good = lastCode();
    const wrong = good === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) {
      const r = await change("change_phone", NEW_PHONE, { code: wrong, identityProof: proof });
      expect(r.status).toBe(401);
      expect(await errCode(r)).toBe("otp_invalid");
    }
    const locked = await change("change_phone", NEW_PHONE, { code: good, identityProof: proof });
    expect(locked.status).toBe(429);
    expect(await errCode(locked)).toBe("otp_locked");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("an expired code is refused", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const code = lastCode();
    rows("phone_otps")[rows("phone_otps").length - 1].expires_at = new Date(Date.now() - 1000).toISOString();
    const res = await change("change_phone", NEW_PHONE, { code, identityProof: proof });
    expect(await errCode(res)).toBe("otp_expired");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("a code sent to one number cannot authorise a different number", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const res = await change("change_phone", "+2348055555555", { code: lastCode(), identityProof: proof });
    expect(res.status).toBe(400);
    expect(await errCode(res)).toBe("otp_missing");
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("a code is single-use: replaying it after a successful change fails", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const code = lastCode();
    expect((await change("change_phone", NEW_PHONE, { code, identityProof: proof })).status).toBe(200);
    // Move away again, then try to reuse the consumed code for the same number.
    rows("profiles")[0].phone = PHONE;
    const replay = await change("change_phone", NEW_PHONE, { code, identityProof: proof });
    expect(replay.status).toBe(400);
    expect(rows("profiles")[0].phone).toBe(PHONE);
  });

  it("an identity proof issued for another user, an expired one, and a tampered one are all refused", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const code = lastCode();
    const others = [
      issueIdentityProof("user-2").proof,
      issueIdentityProof("user-1", Date.now() - IDENTITY_PROOF_TTL_MS - 1000).proof,
      proof.slice(0, -3) + "AAA",
      "garbage",
    ];
    for (const bad of others) {
      const r = await change("change_phone", NEW_PHONE, { code, identityProof: bad });
      expect(r.status).toBe(403);
      expect(await errCode(r)).toBe("identity_required");
    }
    expect(rows("profiles")[0].phone).toBe(PHONE);
    // ...and the good proof still works with the same, untouched code.
    expect((await change("change_phone", NEW_PHONE, { code, identityProof: proof })).status).toBe(200);
  });

  it("a rotated signing secret invalidates outstanding proofs (fails closed)", async () => {
    const proof = await passIdentity();
    process.env.OTP_PROOF_SECRET = "rotated";
    const res = await sendNew("phone", NEW_PHONE, proof);
    expect(res.status).toBe(403);
  });

  it("an invalid session cannot change anything", async () => {
    const proof = await passIdentity();
    const res = await change("change_phone", NEW_PHONE, { code: "123456", identityProof: proof }, "not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("user B cannot use user A's proof or code", async () => {
    const proof = await passIdentity(); // user-1
    await sendNew("phone", NEW_PHONE, proof);
    const code = lastCode();
    const res = await change("change_phone", NEW_PHONE, { code, identityProof: proof }, "tok-user-2");
    expect(res.status).toBe(403);
    expect(rows("profiles").find((p) => p.id === "user-2")!.phone).toBe("+2348099999999");
  });
});

describe("send-code guards", () => {
  it("requires a signed-in user", async () => {
    const proof = await passIdentity();
    const res = await sendNew("phone", NEW_PHONE, proof, null);
    expect(res.status).toBe(401);
    expect(h.deliver).toHaveBeenCalledTimes(1); // only the identity code
  });

  it("requires a valid identity proof, so no SMS is spent without it", async () => {
    const before = h.deliver.mock.calls.length;
    const res = await sendNew("phone", NEW_PHONE, "x".repeat(40));
    expect(res.status).toBe(403);
    expect(await errCode(res)).toBe("identity_required");
    expect(h.deliver.mock.calls.length).toBe(before);
  });

  it.each([["phone", "12"], ["phone", "abcdefghij"], ["email", "not-an-email"], ["email", "a@b"]])(
    "rejects an invalid %s (%s)",
    async (channel, target) => {
      const proof = await passIdentity();
      const res = await sendNew(channel as "phone" | "email", target, proof);
      expect([400]).toContain(res.status);
    },
  );

  it("refuses the number or email the user already has", async () => {
    const proof = await passIdentity();
    const p = await sendNew("phone", "0801 234 5678", proof);
    expect(p.status).toBe(400);
    expect(await errCode(p)).toBe("same_as_current");
    const e = await sendNew("email", "ADA@ona.test", proof);
    expect(await errCode(e)).toBe("same_as_current");
  });

  it.each(["+2348099999999", "08099999999", "2348099999999", "0809 999 9999"])(
    "refuses a phone another account already uses, however it is typed (%s)",
    async (typed) => {
      const proof = await passIdentity();
      const res = await sendNew("phone", typed, proof);
      expect(res.status).toBe(409);
      expect(await errCode(res)).toBe("in_use");
    },
  );

  it("refuses an email another account already uses (case-insensitive)", async () => {
    const proof = await passIdentity();
    const res = await sendNew("email", "BOLA@ona.test", proof);
    expect(res.status).toBe(409);
    expect(await errCode(res)).toBe("in_use");
  });

  it("fails closed when the duplicate lookup errors", async () => {
    const proof = await passIdentity();
    const original = db().from.bind(db());
    db().from = ((table: string) => {
      const q = original(table) as unknown as { or: (r: string) => unknown; then: (a: (v: unknown) => void, b: (e: unknown) => void) => void; fail?: boolean };
      const or = q.or.bind(q);
      const then = q.then.bind(q);
      q.or = (raw: string) => { if (raw.includes("phone")) q.fail = true; return or(raw); };
      q.then = (res, rej) => (q.fail ? res({ data: null, error: { message: "db down" } }) : then(res, rej));
      return q as never;
    }) as never;
    const res = await sendNew("phone", NEW_PHONE, proof);
    expect(res.status).toBe(503);
    expect(await errCode(res)).toBe("lookup_failed");
  });

  it("enforces the resend cooldown, then allows a new code that replaces the old one", async () => {
    const proof = await passIdentity();
    expect((await sendNew("phone", NEW_PHONE, proof)).status).toBe(200);
    const first = lastCode();
    const tooSoon = await sendNew("phone", NEW_PHONE, proof);
    expect(tooSoon.status).toBe(429);
    expect(await errCode(tooSoon)).toBe("resend_wait");
    ageLatestCode();
    expect((await sendNew("phone", NEW_PHONE, proof)).status).toBe(200);
    const second = lastCode();
    if (first !== second) {
      const old = await change("change_phone", NEW_PHONE, { code: first, identityProof: proof });
      expect(old.status).toBe(401);
    }
    expect((await change("change_phone", NEW_PHONE, { code: second, identityProof: proof })).status).toBe(200);
  });

  it("delivery failure: honest 502, nothing stored, and the code the user already holds still works", async () => {
    const proof = await passIdentity();
    expect((await sendNew("phone", NEW_PHONE, proof)).status).toBe(200);
    const held = lastCode();
    ageLatestCode();
    h.deliver.mockResolvedValueOnce({ ok: false, error: "gateway down" });
    const res = await sendNew("phone", NEW_PHONE, proof);
    expect(res.status).toBe(502);
    expect(await errCode(res)).toBe("delivery_failed");
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("gateway down");
    expect(logged).not.toContain(held);
    expect((await change("change_phone", NEW_PHONE, { code: held, identityProof: proof })).status).toBe(200);
  });

  it("no provider and demo off in production: unavailable (503), nothing sent", async () => {
    const proof = await passIdentity();
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    const before = h.deliver.mock.calls.length;
    const res = await sendNew("phone", NEW_PHONE, proof);
    expect(res.status).toBe(503);
    expect(await errCode(res)).toBe("delivery_unavailable");
    expect(h.deliver.mock.calls.length).toBe(before);
  });

  it("even with the demo flags on, production never falls back to the demo code here", async () => {
    const proof = await passIdentity();
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    const res = await sendNew("phone", NEW_PHONE, proof);
    expect(res.status).toBe(503);
  });

  it("in local development the demo code works end to end", async () => {
    const proof = await passIdentity();
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    vi.stubEnv("NODE_ENV", "development");
    const send = await sendNew("phone", NEW_PHONE, proof);
    expect(send.status).toBe(200);
    expect((await send.json()).data.delivery).toBe("demo");
    const res = await change("change_phone", NEW_PHONE, { code: "336699", identityProof: proof });
    expect(res.status).toBe(200);
    expect(rows("profiles")[0].phone).toBe(NEW_PHONE);
  });

  it("per-user and per-IP caps return 429 before any message is sent", async () => {
    const proof = await passIdentity();
    const before = h.deliver.mock.calls.length;
    h.limits.block = "change-contact-day:";
    expect((await sendNew("phone", NEW_PHONE, proof)).status).toBe(429);
    h.limits.block = "change-contact-ip:";
    expect((await sendNew("phone", NEW_PHONE, proof)).status).toBe(429);
    expect(h.deliver.mock.calls.length).toBe(before);
  });
});

describe("race and ordering safety", () => {
  it("someone taking the number after the code was sent still blocks the change, and the code is kept", async () => {
    const proof = await passIdentity();
    await sendNew("phone", NEW_PHONE, proof);
    const code = lastCode();
    rows("profiles").push({ id: "user-3", email: "c@ona.test", phone: NEW_PHONE, is_active: true });
    const res = await change("change_phone", NEW_PHONE, { code, identityProof: proof });
    expect(res.status).toBe(409);
    expect(rows("profiles")[0].phone).toBe(PHONE);
    // Not charged for a change that could not happen.
    expect(rows("phone_otps").filter((r) => String(r.phone).startsWith("change:") && !r.consumed_at)).toHaveLength(1);
  });

  it("changing to the same number via the action is a no-op rejection", async () => {
    const proof = await passIdentity();
    const res = await change("change_phone", "08012345678", { code: "123456", identityProof: proof });
    expect(res.status).toBe(400);
    expect(await errCode(res)).toBe("same_as_current");
  });

  it("the old email no longer matches a login code after the change; the new one does", async () => {
    const proof = await passIdentity();
    await sendNew("email", NEW_EMAIL, proof);
    expect((await change("change_email", NEW_EMAIL, { code: lastCode(), identityProof: proof })).status).toBe(200);
    ageLatestCode();
    h.deliver.mockClear();
    const oldRes = await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    expect(oldRes.status).toBe(404);
    const newRes = await call(loginSend, "/api/auth/otp/send", { channel: "email", target: NEW_EMAIL }, null);
    expect(newRes.status).toBe(200);
  });
});

describe("identity step", () => {
  it("wrong password is refused and issues no proof", async () => {
    h.passwordOk = false;
    await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    stamp();
    const res = await call(verifyIdentity, "/api/security/verify-identity", {
      accessToken: TOKEN, password: "nope", emailCode: lastCode(),
    }, null);
    expect(res.status).toBe(403);
    expect((await res.json()).data).toBeUndefined();
  });

  it("5 wrong email codes void the code, and the right one no longer works", async () => {
    await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    stamp();
    const good = lastCode();
    const wrong = good === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) {
      const r = await call(verifyIdentity, "/api/security/verify-identity", { accessToken: TOKEN, password: "p", emailCode: wrong }, null);
      expect(r.status).toBe(401);
    }
    const locked = await call(verifyIdentity, "/api/security/verify-identity", { accessToken: TOKEN, password: "p", emailCode: good }, null);
    expect(locked.status).toBe(429);
  });

  it("is rate limited per user", async () => {
    h.limits.block = "verify-identity:";
    const res = await call(verifyIdentity, "/api/security/verify-identity", { accessToken: TOKEN, password: "p", emailCode: "123456" }, null);
    expect(res.status).toBe(429);
  });

  it("the demo code is not accepted for the identity step in production unless demo is switched on", async () => {
    await call(loginSend, "/api/auth/otp/send", { channel: "email", target: EMAIL }, null);
    stamp();
    const res = await call(verifyIdentity, "/api/security/verify-identity", { accessToken: TOKEN, password: "p", emailCode: "336699" }, null);
    expect(res.status).toBe(401);
  });
});

/**
 * Changing the payout / refund bank account, end to end through the REAL handlers
 * sharing one in-memory database:
 *
 *   POST /api/security/change-bank/send-code    code to the phone ON THE ACCOUNT
 *   POST /api/security/change-bank/verify-code  code -> bankProof
 *   POST /api/security/action (change_bank)     details + bankProof
 *   POST /api/profile/update                    the generic save (must not be a way round the above)
 *
 * Only the outside world is faked: SMS delivery (the code a user would receive
 * is captured), Supabase auth and the rate-limit store.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const h = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  return {
    db: null as unknown,
    deliver: vi.fn(),
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
vi.mock("@/lib/server/notifications", () => ({ insertNotification: vi.fn(async () => undefined) }));

import { POST as sendCode } from "../change-bank/send-code/route";
import { POST as verifyCode } from "../change-bank/verify-code/route";
import { POST as action } from "../action/route";
import { POST as profileUpdate } from "@/app/api/profile/update/route";
import { issueBankChangeProof, BANK_CHANGE_PROOF_TTL_MS } from "@/lib/server/otp/bank-change-proof";
import { issueIdentityProof } from "@/lib/server/otp/identity-proof";

const PHONE = "+2348012345678";
const TOKEN = "tok-user-1";
const BANK_A = { bank_name: "GTBank", bank_account_name: "Ada User", bank_account_number: "0123456789", bank_code: "058" };
const NEW_BANK = { bankName: "Access Bank", bankAccountName: "Ada User", bankAccountNumber: "9876543210", bankCode: "044" };

const db = () => h.db as FakeSupabase;
const rows = (t: string): Row[] => (db().rows[t] ?? []) as Row[];

function newDb(extra: Record<string, Row[]> = {}) {
  const sb = new FakeSupabase({
    profiles: [
      { id: "user-1", email: "ada@ona.test", phone: PHONE, role: "repair_pro", is_active: true, full_name: "Ada User" },
      { id: "user-2", email: "bola@ona.test", phone: "+2348099999999", role: "motorist", is_active: true, full_name: "Bola" },
    ],
    repair_pro_profiles: [{ user_id: "user-1", ...BANK_A }],
    motorist_profiles: [{ user_id: "user-1", ...BANK_A }, { user_id: "user-2" }],
    payout_methods: [],
    phone_otps: [],
    profile_audit_log: [],
    ...extra,
  });
  (sb as unknown as { auth: unknown }).auth = {
    getUser: async (token: string) => {
      const user = h.users[token];
      return { data: { user: user ?? null }, error: user ? null : { message: "bad" } };
    },
  };
  h.db = sb;
}

const call = (route: (r: Request) => Promise<Response>, body: unknown, token: string | null = TOKEN) =>
  route(
    new Request("https://ona.test/api/x", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

/** Postgres fills created_at (DEFAULT now()); the in-memory fake does not. */
const stamp = () => { for (const r of rows("phone_otps")) if (!r.created_at) r.created_at = new Date().toISOString(); };
const lastCode = () => String((h.deliver.mock.calls[h.deliver.mock.calls.length - 1][0] as { code: string }).code);
const ageLatestCode = () => { const a = rows("phone_otps"); a[a.length - 1].created_at = new Date(Date.now() - 120_000).toISOString(); };
const errCode = async (r: Response) => (await r.json()).error?.code as string;

const send = async (token: string | null = TOKEN, body: unknown = {}) => { const r = await call(sendCode, body, token); stamp(); return r; };
const verify = (code: string, token: string | null = TOKEN) => call(verifyCode, { code }, token);
const change = (extra: Record<string, unknown>, bank: Record<string, unknown> = NEW_BANK, token = TOKEN) =>
  call(action, { action: "change_bank", accessToken: token, newValue: JSON.stringify(bank), ...extra }, null);
const save = (patch: Record<string, unknown>, token = TOKEN) =>
  call(profileUpdate, { access_token: token, ...patch }, null);

async function getProof(token = TOKEN): Promise<string> {
  expect((await send(token)).status).toBe(200);
  const res = await verify(lastCode(), token);
  expect(res.status).toBe(200);
  return (await res.json()).data.bankProof as string;
}
const proBank = () => rows("repair_pro_profiles").find((r) => r.user_id === "user-1")!;
const motBank = () => rows("motorist_profiles").find((r) => r.user_id === "user-1")!;

const ENV = ["AT_USERNAME", "AT_API_KEY", "OTP_DEMO_MODE", "NEXT_PUBLIC_OTP_DEMO_MODE", "OTP_PROOF_SECRET", "NEXT_PUBLIC_APP_URL"];
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ENV) { saved[k] = process.env[k]; delete process.env[k]; }
  process.env.AT_USERNAME = "ona";
  process.env.AT_API_KEY = "key";
  process.env.OTP_PROOF_SECRET = "bank-change-secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://ona.app";
  vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "error").mockImplementation(() => {});
  h.deliver.mockReset().mockResolvedValue({ ok: true });
  h.limits.block = null;
  newDb();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
});

describe("happy path", () => {
  it("code to the account's phone -> proof -> bank changed on both role rows, audited", async () => {
    // Even if a client tries to choose where the code goes, it goes to the phone on the account.
    expect((await send(TOKEN, { phone: "+2348055555555", target: "+2348055555555" })).status).toBe(200);
    const sms = h.deliver.mock.calls[0][0] as Record<string, unknown>;
    expect(sms).toMatchObject({ channel: "phone", to: PHONE, purpose: "verify", origin: "https://ona.app" });
    expect(String(sms.code)).toMatch(/^\d{6}$/);
    expect(sms.code).not.toBe("336699");
    const stored = rows("phone_otps").filter((r) => String(r.phone).startsWith("bank:"));
    expect(stored).toHaveLength(1);
    expect(stored[0].phone).toBe(`bank:user-1:${PHONE}`);
    expect(JSON.stringify(stored)).not.toContain(String(sms.code));

    const v = await verify(String(sms.code));
    expect(v.status).toBe(200);
    const proof = (await v.json()).data.bankProof as string;
    expect(proof).toBeTruthy();

    const res = await change({ bankProof: proof });
    expect(res.status).toBe(200);
    expect(proBank()).toMatchObject({ bank_name: "Access Bank", bank_account_number: "9876543210", bank_code: "044" });
    expect(motBank()).toMatchObject({ bank_account_number: "9876543210", bank_code: "044" });
    expect(rows("profile_audit_log")[0]).toMatchObject({ action_type: "change_bank", status: "completed", risk_tier: "critical", masked_new_value: "****3210" });
    // The code is single-use.
    expect(rows("phone_otps").filter((r) => String(r.phone).startsWith("bank:") && !r.consumed_at)).toHaveLength(0);
  });

  it("the app's follow-up generic save with the NEW bank passes; a stale save with the OLD bank is rejected", async () => {
    expect((await change({ bankProof: await getProof() })).status).toBe(200);
    const fresh = await save({ bankAccountNumber: "9876543210", bankCode: "044", bankName: "Access Bank", city: "Abuja" });
    expect(fresh.status).toBe(200);
    const stale = await save({ bankAccountNumber: "0123456789", bankCode: "058", city: "Kano" });
    expect(stale.status).toBe(403);
    expect(await errCode(stale)).toBe("bank_change_requires_verification");
    expect(proBank().bank_account_number).toBe("9876543210");
  });

  it("normalises the details (digits only, trimmed) before saving", async () => {
    const res = await change({ bankProof: await getProof() }, { ...NEW_BANK, bankAccountNumber: "9876 543 210", bankName: "  Access Bank ", bankCode: " 044 " });
    expect(res.status).toBe(200);
    expect(proBank()).toMatchObject({ bank_account_number: "9876543210", bank_name: "Access Bank", bank_code: "044" });
  });
});

describe("the server enforces the proof (the browser cannot skip it)", () => {
  it("rejects a change with no proof and leaves the bank untouched", async () => {
    const res = await change({});
    expect(res.status).toBe(403);
    expect(await errCode(res)).toBe("verification_required");
    expect(proBank().bank_account_number).toBe("0123456789");
    expect(rows("profile_audit_log")).toHaveLength(0);
  });

  it("rejects proofs that are invalid: other user, expired, tampered, garbage, and an identity proof (wrong kind)", async () => {
    const good = await getProof();
    const bad = [
      issueBankChangeProof("user-2").proof,
      issueBankChangeProof("user-1", Date.now() - BANK_CHANGE_PROOF_TTL_MS - 1000).proof,
      good.slice(0, -3) + "AAA",
      "garbage",
      issueIdentityProof("user-1").proof,
    ];
    for (const proof of bad) {
      const r = await change({ bankProof: proof });
      expect(r.status).toBe(403);
      expect(await errCode(r)).toBe("verification_required");
    }
    expect(proBank().bank_account_number).toBe("0123456789");
    expect((await change({ bankProof: good })).status).toBe(200);
  });

  it("a rotated signing secret invalidates outstanding proofs (fails closed)", async () => {
    const proof = await getProof();
    process.env.OTP_PROOF_SECRET = "rotated";
    expect((await change({ bankProof: proof })).status).toBe(403);
  });

  it("user B cannot use user A's proof", async () => {
    const proof = await getProof();
    const r = await change({ bankProof: proof }, NEW_BANK, "tok-user-2");
    expect(r.status).toBe(403);
    expect(proBank().bank_account_number).toBe("0123456789");
  });

  it("an invalid session cannot change anything", async () => {
    expect((await change({ bankProof: "x".repeat(40) }, NEW_BANK, "not-a-token")).status).toBe(401);
  });
});

describe("the code step", () => {
  it("requires a signed-in user", async () => {
    expect((await send(null)).status).toBe(401);
    expect((await verify("123456", null)).status).toBe(401);
    expect(h.deliver).not.toHaveBeenCalled();
  });

  it("a wrong code is refused and counted; 5 wrong guesses lock it, even the right code then fails", async () => {
    expect((await send()).status).toBe(200);
    const good = lastCode();
    const wrong = good === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) {
      const r = await verify(wrong);
      expect(r.status).toBe(401);
      expect(await errCode(r)).toBe("otp_invalid");
    }
    const locked = await verify(good);
    expect(locked.status).toBe(429);
    expect(await errCode(locked)).toBe("otp_locked");
  });

  it("an expired code is refused", async () => {
    expect((await send()).status).toBe(200);
    const code = lastCode();
    rows("phone_otps")[0].expires_at = new Date(Date.now() - 1000).toISOString();
    expect(await errCode(await verify(code))).toBe("otp_expired");
  });

  it("a code is single-use", async () => {
    expect((await send()).status).toBe(200);
    const code = lastCode();
    expect((await verify(code)).status).toBe(200);
    const again = await verify(code);
    expect(again.status).toBe(400);
    expect(await errCode(again)).toBe("otp_missing");
  });

  it("one user's code never works for another user, nor a login/contact-change style key", async () => {
    expect((await send()).status).toBe(200);
    const code = lastCode();
    const other = await verify(code, "tok-user-2");
    expect(other.status).toBe(400); // user-2 has no code of their own
    expect(await errCode(other)).toBe("otp_missing");
  });

  it("the demo code is rejected in production, even with the demo flags on", async () => {
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    expect((await send()).status).toBe(200);
    const r = await verify("336699");
    expect(r.status).toBe(401);
  });

  it("an account with no phone number cannot start (clear message), nothing is sent", async () => {
    newDb({ profiles: [{ id: "user-1", email: "ada@ona.test", phone: null, role: "repair_pro", is_active: true }] });
    const r = await send();
    expect(r.status).toBe(400);
    expect(await errCode(r)).toBe("no_phone");
    expect(h.deliver).not.toHaveBeenCalled();
  });

  it("enforces the resend cooldown, then a new code replaces the old one", async () => {
    expect((await send()).status).toBe(200);
    const first = lastCode();
    const tooSoon = await send();
    expect(tooSoon.status).toBe(429);
    expect(await errCode(tooSoon)).toBe("resend_wait");
    ageLatestCode();
    expect((await send()).status).toBe(200);
    const second = lastCode();
    if (first !== second) expect((await verify(first)).status).toBe(401);
    expect((await verify(second)).status).toBe(200);
  });

  it("delivery failure: honest 502, and the code the user already holds still works", async () => {
    expect((await send()).status).toBe(200);
    const held = lastCode();
    ageLatestCode();
    h.deliver.mockResolvedValueOnce({ ok: false, error: "gateway down" });
    const r = await send();
    expect(r.status).toBe(502);
    expect(await errCode(r)).toBe("delivery_failed");
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("gateway down");
    expect(logged).not.toContain(held);
    expect((await verify(held)).status).toBe(200);
  });

  it("no SMS provider in production: unavailable (503), nothing sent, even with the demo flags on", async () => {
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    process.env.OTP_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_OTP_DEMO_MODE = "true";
    const r = await send();
    expect(r.status).toBe(503);
    expect(await errCode(r)).toBe("delivery_unavailable");
    expect(h.deliver).not.toHaveBeenCalled();
  });

  it("in local development the demo code works end to end", async () => {
    delete process.env.AT_USERNAME;
    delete process.env.AT_API_KEY;
    vi.stubEnv("NODE_ENV", "development");
    const s = await send();
    expect(s.status).toBe(200);
    expect((await s.json()).data.delivery).toBe("demo");
    const v = await verify("336699");
    expect(v.status).toBe(200);
    expect((await change({ bankProof: (await v.json()).data.bankProof })).status).toBe(200);
  });

  it("per-user and per-IP caps return 429 before any SMS is sent; verify is rate limited too", async () => {
    h.limits.block = "change-bank-day:";
    expect((await send()).status).toBe(429);
    h.limits.block = "change-bank-ip:";
    expect((await send()).status).toBe(429);
    h.limits.block = "change-bank-verify:";
    expect((await verify("123456")).status).toBe(429);
    expect(h.deliver).not.toHaveBeenCalled();
  });
});

describe("validation and uniqueness at change time", () => {
  it.each([
    ["short number", { ...NEW_BANK, bankAccountNumber: "12345" }],
    ["long number", { ...NEW_BANK, bankAccountNumber: "12345678901" }],
    ["letters only", { ...NEW_BANK, bankAccountNumber: "abcdefghij" }],
  ])("rejects a %s with 400", async (_n, bank) => {
    const r = await change({ bankProof: await getProof() }, bank);
    expect(r.status).toBe(400);
    expect(proBank().bank_account_number).toBe("0123456789");
  });

  it.each(["bankName", "bankAccountName", "bankAccountNumber", "bankCode"])("rejects a missing %s", async (field) => {
    const bank: Record<string, unknown> = { ...NEW_BANK };
    delete bank[field];
    expect((await change({ bankProof: await getProof() }, bank)).status).toBe(400);
  });

  it("rejects an account another user already has (any of: motorist row, pro row, payout method) and does not write", async () => {
    const seeds: Record<string, Row[]>[] = [
      { motorist_profiles: [{ user_id: "user-1", ...BANK_A }, { user_id: "user-2", bank_account_number: "9876543210", bank_code: "044" }] },
      { repair_pro_profiles: [{ user_id: "user-1", ...BANK_A }, { user_id: "user-2", bank_account_number: "9876543210", bank_code: "044" }] },
      { payout_methods: [{ user_id: "user-2", bank_code: "044", account_number_last4: "3210" }] },
    ];
    for (const seed of seeds) {
      newDb(seed);
      const r = await change({ bankProof: await getProof() });
      expect(r.status).toBe(409);
      expect(await errCode(r)).toBe("bank_account_in_use");
      expect(proBank().bank_account_number).toBe("0123456789");
    }
  });

  it("the same account number at a DIFFERENT bank code is not a duplicate", async () => {
    newDb({ motorist_profiles: [{ user_id: "user-1", ...BANK_A }, { user_id: "user-2", bank_account_number: "9876543210", bank_code: "999" }] });
    expect((await change({ bankProof: await getProof() })).status).toBe(200);
  });

  it("a failed write is reported as an error, not as success, and the proof is not wasted", async () => {
    const proof = await getProof();
    const original = db().from.bind(db());
    db().from = ((table: string) => {
      const q = original(table) as unknown as { update: (r: Row) => { then: (a: (v: unknown) => void, b: (e: unknown) => void) => void } };
      if (table === "repair_pro_profiles") {
        const update = q.update.bind(q);
        q.update = (row: Row) => {
          const u = update(row);
          u.then = (res) => res({ data: null, error: { message: "db down" } });
          return u;
        };
      }
      return q as never;
    }) as never;
    const r = await change({ bankProof: proof });
    expect(r.status).toBe(500);
    expect(await errCode(r)).toBe("update_failed");
    expect(rows("profile_audit_log")[0]).toMatchObject({ action_type: "change_bank", status: "failed" });
    db().from = original as never;
    expect((await change({ bankProof: proof })).status).toBe(200);
  });
});

describe("the generic profile save is not a way round the proof", () => {
  it("rejects pointing payouts at a different account, and saves nothing else from that request", async () => {
    const r = await save({ bankAccountNumber: "9876543210", bankCode: "044", city: "Abuja" });
    expect(r.status).toBe(403);
    expect(await errCode(r)).toBe("bank_change_requires_verification");
    expect(proBank().bank_account_number).toBe("0123456789");
    expect(rows("profiles")[0].city).toBeUndefined();
  });

  it("rejects a different bank code on the same account number, and clearing the number", async () => {
    expect((await save({ bankAccountNumber: "0123456789", bankCode: "044" })).status).toBe(403);
    expect((await save({ bankAccountNumber: "" })).status).toBe(403);
    expect(proBank()).toMatchObject({ bank_account_number: "0123456789", bank_code: "058" });
  });

  it("still passes the unchanged bank the app sends on every save (any number formatting), with other edits saved", async () => {
    const r = await save({ bankAccountNumber: "0123 456 789", bankCode: "058", bankName: "GTBank", bankAccountName: "Ada User", city: "Abuja" });
    expect(r.status).toBe(200);
    expect(rows("profiles")[0].city).toBe("Abuja");
    expect(proBank().bank_account_number).toBe("0123456789");
  });

  it("an account/bank NAME edit alone never moves money and is allowed", async () => {
    expect((await save({ bankAccountName: "Ada U. Okafor" })).status).toBe(200);
    expect((await save({ bankName: "Guaranty Trust Bank" })).status).toBe(200);
  });

  it("first-time setup (nothing on file) is allowed, so signup, bank setup and the role donor copy keep working", async () => {
    newDb({ repair_pro_profiles: [{ user_id: "user-1" }], motorist_profiles: [{ user_id: "user-1" }] });
    const r = await save({ bankAccountNumber: "9876543210", bankCode: "044", bankName: "Access Bank", bankAccountName: "Ada User" });
    expect(r.status).toBe(200);
    expect(proBank()).toMatchObject({ bank_account_number: "9876543210", bank_code: "044" });
  });

  it("a stored bank code that is empty can be filled in for the same account", async () => {
    newDb({ repair_pro_profiles: [{ user_id: "user-1", bank_account_number: "0123456789", bank_code: "" }], motorist_profiles: [{ user_id: "user-1" }] });
    expect((await save({ bankAccountNumber: "0123456789", bankCode: "058" })).status).toBe(200);
  });

  it("a login that holds the bank on its OTHER role row can save that same bank without a false rejection", async () => {
    newDb({ repair_pro_profiles: [{ user_id: "user-1" }], motorist_profiles: [{ user_id: "user-1", ...BANK_A }] });
    expect((await save({ bankAccountNumber: "0123456789", bankCode: "058" })).status).toBe(200);
    expect((await save({ bankAccountNumber: "9876543210", bankCode: "044" })).status).toBe(403);
  });

  it("fails closed when the bank lookup errors", async () => {
    const original = db().from.bind(db());
    db().from = ((table: string) => {
      const q = original(table) as unknown as { maybeSingle: () => Promise<unknown> };
      if (table === "motorist_profiles") q.maybeSingle = async () => ({ data: null, error: { message: "db down" } });
      return q as never;
    }) as never;
    const r = await save({ bankAccountNumber: "9876543210", bankCode: "044" });
    expect(r.status).toBe(503);
    expect(await errCode(r)).toBe("bank_check_failed");
    expect(proBank().bank_account_number).toBe("0123456789");
  });

  it("saves that do not touch the bank are unaffected", async () => {
    expect((await save({ city: "Ikeja", area: "Maryland" })).status).toBe(200);
  });
});

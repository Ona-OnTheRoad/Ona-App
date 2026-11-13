import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const sms = vi.hoisted(() => ({ send: vi.fn() }));
const limits = vi.hoisted(() => ({ block: null as string | null }));
const dbCfg = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  recent: [] as Array<Record<string, unknown>>,
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  updates: [] as Array<{ table: string; patch: Record<string, unknown> }>,
}));

// The real schema module needs the (not installed here) zod-to-openapi package.
vi.mock("@/lib/server/openapi/schemas/auth", () => ({
  authOtpSendBodySchema: z.object({
    channel: z.enum(["phone", "email"]),
    target: z.string().min(3).max(120),
    opKey: z.string().optional().nullable(),
    opActorId: z.string().optional().nullable(),
  }),
}));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: async ({ key }: { key: string }) =>
    limits.block && key.startsWith(limits.block) ? { ok: false, retryAfterSec: 60 } : { ok: true },
  rateLimitUnavailableResponse: () => null,
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
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/server/auth/otp-delivery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/auth/otp-delivery")>()),
  deliverOtp: (...args: unknown[]) => sms.send(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      let op: "select" | "update" | "insert" = "select";
      let payload: Record<string, unknown> = {};
      const b: Record<string, unknown> = {};
      for (const m of ["select", "eq", "or", "order", "limit", "is", "ilike"]) b[m] = () => b;
      b.update = (p: Record<string, unknown>) => {
        op = "update";
        payload = p;
        return b;
      };
      b.insert = (p: Record<string, unknown>) => {
        op = "insert";
        dbCfg.inserts.push({ table, row: p });
        return b;
      };
      b.maybeSingle = async () => ({ data: table === "profiles" ? (dbCfg.profiles[0] ?? null) : null, error: null });
      b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
        let out: unknown;
        if (op === "update") {
          dbCfg.updates.push({ table, patch: payload });
          out = { error: null };
        } else if (op === "insert") out = { error: null };
        else out = { data: table === "profiles" ? dbCfg.profiles : dbCfg.recent, error: null };
        return Promise.resolve(out).then(res, rej);
      };
      return b;
    },
  }),
}));

import { POST } from "../send/route";

const registered = [{ id: "u1", phone: "+2348031234567", is_active: true }];
const call = (body: Record<string, unknown>) =>
  POST(
    new Request("https://ona.test/api/auth/otp/send", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9" },
      body: JSON.stringify(body),
    }),
  );
const phoneBody = { channel: "phone", target: "08031234567" };
const storedHash = () => String(dbCfg.inserts.find((i) => i.table === "phone_otps")?.row.code_hash ?? "");

const ENV = ["AT_USERNAME", "AT_API_KEY", "NEXT_PUBLIC_APP_URL", "OTP_DEMO_MODE", "NEXT_PUBLIC_OTP_DEMO_MODE", "RESEND_API_KEY"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.stubEnv("NODE_ENV", "production");
  sms.send.mockReset().mockResolvedValue({ ok: true, messageId: "ATX1" });
  limits.block = null;
  dbCfg.profiles = registered;
  dbCfg.recent = [];
  dbCfg.inserts = [];
  dbCfg.updates = [];
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

const goLive = () => {
  process.env.AT_USERNAME = "ona";
  process.env.AT_API_KEY = "key";
  process.env.NEXT_PUBLIC_APP_URL = "https://ona.app";
};

describe("POST /api/auth/otp/send, live SMS", () => {
  it("sends a real random code by SMS with the app origin for auto-fill", async () => {
    goLive();
    const res = await call(phoneBody);
    expect(res.status).toBe(200);
    const body = (await res.json()).data;
    expect(body).toMatchObject({ sent: true, delivery: "sms", resendInSec: 30, expiresInSec: 600 });
    expect(sms.send).toHaveBeenCalledTimes(1);
    const arg = sms.send.mock.calls[0][0] as { channel: string; to: string; code: string; origin: string };
    expect(arg.channel).toBe("phone");
    expect(arg.to).toBe("+2348031234567");
    expect(arg.code).toMatch(/^\d{6}$/);
    expect(arg.code).not.toBe("336699");
    expect(arg.origin).toBe("https://ona.app");
    // Only a hash of the code is stored, never the code.
    expect(JSON.stringify(dbCfg.inserts)).not.toContain(arg.code);
    expect(storedHash()).toHaveLength(64);
  });

  it("never reports success when the SMS gateway refuses, and stores no unusable code", async () => {
    goLive();
    sms.send.mockResolvedValue({ ok: false, error: "InsufficientBalance" });
    const res = await call(phoneBody);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe("otp_delivery_failed");
    // Delivery happens before storing: nothing is rotated or left behind.
    expect(dbCfg.inserts).toHaveLength(0);
    // The ops log has the cause but never the code or the full number.
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).toContain("InsufficientBalance");
    expect(logged).not.toContain("2348031234567");
  });

  it("does not send to a phone number that has no account", async () => {
    goLive();
    dbCfg.profiles = [];
    const res = await call(phoneBody);
    expect(res.status).toBe(404);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("enforces the resend cooldown without sending or issuing another code", async () => {
    goLive();
    dbCfg.recent = [{ id: "o1", created_at: new Date(Date.now() - 5_000).toISOString(), attempts: 0, consumed_at: null }];
    const res = await call(phoneBody);
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/wait \d+s/i);
    expect(sms.send).not.toHaveBeenCalled();
    expect(dbCfg.inserts).toHaveLength(0);
  });

  it("allows a new code once the cooldown has passed", async () => {
    goLive();
    dbCfg.recent = [{ id: "o1", created_at: new Date(Date.now() - 31_000).toISOString(), attempts: 0, consumed_at: null }];
    expect((await call(phoneBody)).status).toBe(200);
    expect(sms.send).toHaveBeenCalledTimes(1);
  });

  it("stops a number that hit its daily cap and an IP that hit its hourly cap", async () => {
    goLive();
    limits.block = "otp-send-day:";
    expect((await call(phoneBody)).status).toBe(429);
    limits.block = "otp-send-ip:";
    expect((await call(phoneBody)).status).toBe(429);
    expect(sms.send).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/otp/send, demo / rollout behaviour", () => {
  it("with demo explicitly switched on and no SMS provider, issues the demo code and sends nothing", async () => {
    process.env.OTP_DEMO_MODE = "true";
    const res = await call(phoneBody);
    expect(res.status).toBe(200);
    expect((await res.json()).data.delivery).toBe("demo");
    expect(sms.send).not.toHaveBeenCalled();
    expect(storedHash()).toHaveLength(64);
  });

  it("fails clearly (not silently) in production when no provider is configured and demo is off", async () => {
    const res = await call(phoneBody);
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("otp_delivery_unavailable");
    expect(dbCfg.inserts).toHaveLength(0);
    expect(sms.send).not.toHaveBeenCalled();
  });

  it("keeps the email channel on the demo code only while demo is switched on and no email provider exists", async () => {
    process.env.OTP_DEMO_MODE = "true";
    dbCfg.profiles = [{ id: "u1", email: "ada@example.com", is_active: true }];
    const res = await call({ channel: "email", target: "ada@example.com" });
    expect(res.status).toBe(200);
    expect((await res.json()).data.delivery).toBe("email_demo");
    expect(sms.send).not.toHaveBeenCalled();
  });
});

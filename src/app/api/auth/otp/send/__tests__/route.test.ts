import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/otp/send/route";
import { DEMO_OTP_CODE } from "@/lib/auth/demo-otp";
import { isSmsConfigured, sendSms } from "@/lib/server/sms/send";
import { isResendConfigured, sendResendEmail } from "@/lib/server/resend";
import { createServiceSupabase } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/server/modules/rate-limit", () => ({
  rateLimitAsync: vi.fn(async () => ({ ok: true })),
  rateLimitUnavailableResponse: vi.fn(() => null),
}));
vi.mock("@/lib/server/sms/send", () => ({
  isSmsConfigured: vi.fn(() => false),
  sendSms: vi.fn(),
}));
vi.mock("@/lib/server/resend", () => ({
  isResendConfigured: vi.fn(() => false),
  sendResendEmail: vi.fn(),
}));

const PHONE = "+2348000000001";
const EMAIL = "person@example.test";

type Write = { table: string; op: "insert" | "update"; values: Record<string, unknown> };

/** Minimal chainable stand-in for the two tables the route touches. */
function fakeDb() {
  const writes: Write[] = [];
  const from = (table: string) => {
    const read = table === "profiles"
      ? { data: [{ id: "u1", phone: PHONE, email: EMAIL, is_active: true }], error: null }
      : { data: [], error: null };
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "eq", "or", "ilike", "order", "is"]) chain[m] = () => chain;
    chain.limit = async () => read;
    chain.maybeSingle = async () => ({ data: read.data[0] ?? null, error: null });
    chain.update = (values: Record<string, unknown>) => {
      writes.push({ table, op: "update", values });
      const done = { eq: () => done, is: async () => ({ error: null }) };
      return done;
    };
    chain.insert = async (values: Record<string, unknown>) => {
      writes.push({ table, op: "insert", values });
      return { error: null };
    };
    return chain;
  };
  vi.mocked(createServiceSupabase).mockReturnValue(
    { from } as unknown as ReturnType<typeof createServiceSupabase>,
  );
  return writes;
}

function send(channel: "phone" | "email") {
  return POST(new Request("https://ona.test/api/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ channel, target: channel === "phone" ? PHONE : EMAIL }),
  }));
}

function productionDemoOff() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("OTP_DEMO_MODE", "");
  vi.stubEnv("NEXT_PUBLIC_OTP_DEMO_MODE", "");
}

/** The 6-digit code inside the SMS text or the email body. */
function codeIn(text: string): string {
  return /\b(\d{6})\b/.exec(text)?.[1] ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSmsConfigured).mockReturnValue(false);
  vi.mocked(isResendConfigured).mockReturnValue(false);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("POST /api/auth/otp/send delivery", () => {
  it("reports a failed SMS instead of 'Code sent' and stores nothing", async () => {
    productionDemoOff();
    const writes = fakeDb();
    vi.mocked(isSmsConfigured).mockReturnValue(true);
    vi.mocked(sendSms).mockResolvedValue({ ok: false, error: "provider down", attempts: [] });

    const res = await send("phone");
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error.code).toBe("otp_delivery_failed");
    expect(body.error.message).not.toMatch(/provider down/);
    expect(writes).toEqual([]);
  });

  it("stores the code only after the SMS went out", async () => {
    productionDemoOff();
    const writes = fakeDb();
    vi.mocked(isSmsConfigured).mockReturnValue(true);
    vi.mocked(sendSms).mockResolvedValue({ ok: true, provider: "africastalking", attempts: [] });

    const res = await send("phone");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.delivery).toBe("sms");
    const sms = vi.mocked(sendSms).mock.calls[0][0];
    expect(sms.to).toBe(PHONE);
    expect(codeIn(sms.message)).toMatch(/^\d{6}$/);
    expect(writes.map((w) => `${w.table}.${w.op}`)).toEqual([
      "phone_otps.update",
      "phone_otps.insert",
    ]);
  });

  it.each(["phone", "email"] as const)(
    "fails clearly for %s when there is no provider and no demo mode",
    async (channel) => {
      productionDemoOff();
      const writes = fakeDb();

      const res = await send(channel);
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error.code).toBe("otp_delivery_unavailable");
      expect(writes).toEqual([]);
      expect(sendSms).not.toHaveBeenCalled();
      expect(sendResendEmail).not.toHaveBeenCalled();
    },
  );

  it("emails a real code when the email sender is configured", async () => {
    productionDemoOff();
    const writes = fakeDb();
    vi.mocked(isResendConfigured).mockReturnValue(true);
    vi.mocked(sendResendEmail).mockResolvedValue({ ok: true });

    const res = await send("email");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.delivery).toBe("email");
    const mail = vi.mocked(sendResendEmail).mock.calls[0][0];
    expect(mail.to).toBe(EMAIL);
    const code = codeIn(mail.text ?? "");
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toBe(DEMO_OTP_CODE);
    expect(writes.at(-1)).toMatchObject({ table: "phone_otps", op: "insert" });
    expect(writes.at(-1)?.values.phone).toBe(`email:${EMAIL}`);
  });

  it("reports a failed email send and stores nothing", async () => {
    productionDemoOff();
    const writes = fakeDb();
    vi.mocked(isResendConfigured).mockReturnValue(true);
    vi.mocked(sendResendEmail).mockResolvedValue({ ok: false, error: "bounced" });

    const res = await send("email");

    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("otp_delivery_failed");
    expect(writes).toEqual([]);
  });

  it("keeps the demo path when demo mode is on and no provider is configured", async () => {
    const writes = fakeDb();

    const res = await send("phone");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.delivery).toBe("demo");
    expect(sendSms).not.toHaveBeenCalled();
    expect(writes.at(-1)).toMatchObject({ table: "phone_otps", op: "insert" });
  });

  it("falls back to the demo code when demo mode is on and the SMS fails", async () => {
    const writes = fakeDb();
    vi.mocked(isSmsConfigured).mockReturnValue(true);
    vi.mocked(sendSms).mockResolvedValue({ ok: false, error: "provider down", attempts: [] });

    const res = await send("phone");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.delivery).toBe("demo");
    expect(writes.at(-1)).toMatchObject({ table: "phone_otps", op: "insert" });
  });
});

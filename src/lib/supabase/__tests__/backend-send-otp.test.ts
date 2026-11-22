import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/session", () => ({
  ensureAppSession: vi.fn(async () => null),
  SESSION_RELOGIN_MESSAGE: "Sign in again",
}));
vi.mock("@/lib/supabase/app-client", () => ({
  getAppSupabase: () => ({ auth: { setSession: vi.fn() } }),
}));

import { backendSendOtp } from "@/lib/supabase/app-api";

function makeLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  };
}

const fetchMock = vi.fn();
const sendInput = { channel: "phone" as const, target: "09030000000" };
const sendCalls = () => fetchMock.mock.calls.filter(([url]) => url === "/api/auth/otp/send");
const opKeyOf = (call: unknown[]) =>
  JSON.parse((call[1] as { body: string }).body).opKey as string;

function reply(body: unknown) {
  return { ok: true, json: async () => body };
}
const failed = reply({
  ok: false,
  error: { message: "We could not send your code. Please try again shortly." },
});
const sent = reply({ ok: true, data: { message: "Code sent. Enter it below." } });

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: makeLocalStorage(),
    configurable: true,
    writable: true,
  });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("backendSendOtp idempotency sticker", () => {
  it("uses a fresh op key after a definite failure, so the stored error is not replayed", async () => {
    fetchMock.mockResolvedValueOnce(failed).mockResolvedValueOnce(sent);

    const first = await backendSendOtp(sendInput);
    const second = await backendSendOtp(sendInput);

    expect(first.error).toMatch(/could not send/i);
    expect(second.error).toBeNull();
    const [a, b] = sendCalls();
    expect(opKeyOf(a)).not.toBe(opKeyOf(b));
  });

  it("reuses the op key after a lost response, so a retry cannot send twice", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      // /api/ops/status: the ledger has no record yet
      .mockResolvedValueOnce({ ok: false, json: async () => null })
      .mockResolvedValueOnce(sent);

    const first = await backendSendOtp(sendInput);
    await backendSendOtp(sendInput);

    expect(first).toMatchObject({ error: null, maybeSent: true });
    const [a, b] = sendCalls();
    expect(opKeyOf(a)).toBe(opKeyOf(b));
  });

  it("drops the op key when the ledger reports the lost send as failed", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(
        reply({ ok: true, data: { status: "error", error: "We could not send your code." } }),
      )
      .mockResolvedValueOnce(sent);

    const first = await backendSendOtp(sendInput);
    await backendSendOtp(sendInput);

    expect(first.error).toMatch(/could not send/i);
    const [a, b] = sendCalls();
    expect(opKeyOf(a)).not.toBe(opKeyOf(b));
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SMS_PROVIDERS } from "@/lib/server/sms/providers";
import { isSmsConfigured, orderedSmsProviders, sendSms } from "@/lib/server/sms/send";
import type { SmsProvider, SmsProviderResult } from "@/lib/server/sms/types";

const TO = "+2348000000001";
const MESSAGE = "Ona login code: 123456.";

function fake(name: string, outcome: SmsProviderResult | Error, configured = true) {
  const send = vi.fn(async () => {
    if (outcome instanceof Error) throw outcome;
    return outcome;
  });
  const provider: SmsProvider = { name, isConfigured: () => configured, send };
  return { provider, send };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("sendSms failover", () => {
  it("uses the first provider when it succeeds and does not call the second", async () => {
    const first = fake("first", { ok: true, messageId: "m1" });
    const second = fake("second", { ok: true });

    const result = await sendSms({ to: TO, message: MESSAGE }, [first.provider, second.provider]);

    expect(result).toEqual({ ok: true, provider: "first", messageId: "m1", attempts: [] });
    expect(second.send).not.toHaveBeenCalled();
  });

  it("falls over to the next provider when a send fails", async () => {
    const first = fake("first", { ok: false, error: "gateway down" });
    const second = fake("second", { ok: true, messageId: "m2" });

    const result = await sendSms({ to: TO, message: MESSAGE }, [first.provider, second.provider]);

    expect(result).toEqual({
      ok: true, provider: "second", messageId: "m2",
      attempts: [{ provider: "first", error: "gateway down" }],
    });
    expect(second.send).toHaveBeenCalledWith({ to: TO, message: MESSAGE });
  });

  it("treats a provider that throws as a failed attempt", async () => {
    const first = fake("first", new Error("socket hang up"));
    const second = fake("second", { ok: true });

    const result = await sendSms({ to: TO, message: MESSAGE }, [first.provider, second.provider]);

    expect(result).toMatchObject({ ok: true, provider: "second", attempts: [{ provider: "first", error: "socket hang up" }] });
  });

  it("reports every attempt when all providers fail", async () => {
    const first = fake("first", { ok: false, error: "gateway down" });
    const second = fake("second", { ok: false, error: "no credit" });

    const result = await sendSms({ to: TO, message: MESSAGE }, [first.provider, second.provider]);

    expect(result).toEqual({
      ok: false,
      error: "first: gateway down; second: no credit",
      attempts: [{ provider: "first", error: "gateway down" }, { provider: "second", error: "no credit" }],
    });
  });

  it("normalises the number once and rejects an invalid one without calling anyone", async () => {
    const first = fake("first", { ok: true });

    await sendSms({ to: "08000000001", message: MESSAGE }, [first.provider]);
    expect(first.send).toHaveBeenCalledWith({ to: TO, message: MESSAGE });

    first.send.mockClear();
    expect(await sendSms({ to: "12", message: MESSAGE }, [first.provider])).toEqual({
      ok: false, error: "Invalid phone number", attempts: [],
    });
    expect(first.send).not.toHaveBeenCalled();
  });

  it("fails clearly with no provider", async () => {
    expect(await sendSms({ to: TO, message: MESSAGE }, [])).toMatchObject({
      ok: false, error: "No SMS provider is configured",
    });
  });

  it("never logs the number or the message when it fails over", async () => {
    const first = fake("first", { ok: false, error: "gateway down" });
    const second = fake("second", { ok: true });

    await sendSms({ to: TO, message: MESSAGE }, [first.provider, second.provider]);

    const logged = vi.mocked(console.warn).mock.calls.flat().join(" ");
    expect(logged).toContain("second");
    expect(logged).not.toContain(TO);
    expect(logged).not.toContain("123456");
  });
});

describe("orderedSmsProviders", () => {
  const a = fake("a", { ok: true }).provider;
  const b = fake("b", { ok: true }).provider;
  const off = fake("off", { ok: true }, false).provider;

  it("keeps the default order and skips unconfigured providers", () => {
    expect(orderedSmsProviders([a, off, b], undefined).map((p) => p.name)).toEqual(["a", "b"]);
  });

  it("follows SMS_PROVIDER_ORDER, ignoring unknown and repeated names", () => {
    expect(orderedSmsProviders([a, b], " b , nope, A, b ").map((p) => p.name)).toEqual(["b", "a"]);
  });

  it("uses only the providers named in the order", () => {
    expect(orderedSmsProviders([a, b], "b").map((p) => p.name)).toEqual(["b"]);
  });
});

describe("real adapters", () => {
  function clearEnv() {
    for (const name of ["AT_API_KEY", "AT_USERNAME", "AT_SENDER_ID", "AT_BASE_URL", "TERMII_API_KEY",
      "TERMII_SENDER_ID", "TERMII_BASE_URL", "TERMII_CHANNEL", "SMS_PROVIDER_ORDER"]) vi.stubEnv(name, "");
  }

  it("registers Africa's Talking first and Termii second, both off until configured", () => {
    clearEnv();
    expect(SMS_PROVIDERS.map((p) => p.name)).toEqual(["africastalking", "termii"]);
    expect(isSmsConfigured()).toBe(false);

    vi.stubEnv("TERMII_API_KEY", "test-key");
    vi.stubEnv("TERMII_SENDER_ID", "Ona");
    expect(isSmsConfigured()).toBe(false);
    vi.stubEnv("TERMII_BASE_URL", "https://termii.example.test");
    expect(orderedSmsProviders().map((p) => p.name)).toEqual(["termii"]);
  });

  it("delivers through the second adapter when the first one's API is down", async () => {
    clearEnv();
    vi.stubEnv("AT_API_KEY", "test-key");
    vi.stubEnv("AT_USERNAME", "sandbox");
    vi.stubEnv("TERMII_API_KEY", "test-key");
    vi.stubEnv("TERMII_SENDER_ID", "Ona");
    vi.stubEnv("TERMII_BASE_URL", "https://termii.example.test/");
    const fetchMock = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("africastalking")
        ? new Response("upstream error", { status: 503 })
        : Response.json({ code: "ok", message_id: "tm-1", message: "Successfully Sent" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms({ to: TO, message: MESSAGE });

    expect(result).toMatchObject({ ok: true, provider: "termii", messageId: "tm-1" });
    expect(result.attempts.map((a) => a.provider)).toEqual(["africastalking"]);
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toBe("https://termii.example.test/api/sms/send");
    expect(JSON.parse(String(init.body))).toEqual({
      api_key: "test-key", to: "2348000000001", from: "Ona", sms: MESSAGE, type: "plain", channel: "generic",
    });
  });

  it("treats a Termii error status or a reply without a message id as a failure", async () => {
    clearEnv();
    vi.stubEnv("TERMII_API_KEY", "test-key");
    vi.stubEnv("TERMII_SENDER_ID", "Ona");
    vi.stubEnv("TERMII_BASE_URL", "https://termii.example.test");

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Invalid sender" }, { status: 400 })));
    expect(await sendSms({ to: TO, message: MESSAGE })).toMatchObject({ ok: false, error: "termii: Invalid sender" });

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: "ok" })));
    expect(await sendSms({ to: TO, message: MESSAGE })).toMatchObject({ ok: false, error: "termii: Termii HTTP 200" });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("timeout"); }));
    expect(await sendSms({ to: TO, message: MESSAGE })).toMatchObject({ ok: false, error: "termii: timeout" });
  });
});

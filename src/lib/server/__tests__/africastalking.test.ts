import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildOtpMessage,
  isAfricaTalkingConfigured,
  normalizeNgPhone,
  sendAfricaTalkingSms,
  sendLoginOtpSms,
} from "@/lib/server/africastalking";

describe("normalizeNgPhone", () => {
  it("normalizes 11-digit Nigerian number starting with 0", () => {
    expect(normalizeNgPhone("08031234567")).toBe("+2348031234567");
  });

  it("normalizes number with 234 prefix without +", () => {
    expect(normalizeNgPhone("2348031234567")).toBe("+2348031234567");
  });

  it("passes through already normalized number", () => {
    expect(normalizeNgPhone("+2348031234567")).toBe("+2348031234567");
  });

  it("handles 00 prefix", () => {
    expect(normalizeNgPhone("002348031234567")).toBe("+2348031234567");
  });

  it("strips non-digit characters", () => {
    expect(normalizeNgPhone("+234 (803) 123-4567")).toBe("+2348031234567");
  });

  it("returns null for empty string", () => {
    expect(normalizeNgPhone("")).toBeNull();
  });

  it("returns null for too-short number", () => {
    expect(normalizeNgPhone("12345")).toBeNull();
  });

  it("returns null for invalid characters only", () => {
    expect(normalizeNgPhone("abc")).toBeNull();
  });

  it("strips whitespace", () => {
    expect(normalizeNgPhone("  08031234567  ")).toBe("+2348031234567");
  });
});

describe("isAfricaTalkingConfigured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns true when both API key and username are set", () => {
    process.env.AT_API_KEY = "test-key";
    process.env.AT_USERNAME = "sandbox";
    expect(isAfricaTalkingConfigured()).toBe(true);
  });

  it("returns false when API key is missing", () => {
    process.env.AT_API_KEY = "";
    process.env.AT_USERNAME = "sandbox";
    expect(isAfricaTalkingConfigured()).toBe(false);
  });

  it("returns false when username is missing", () => {
    process.env.AT_API_KEY = "test-key";
    process.env.AT_USERNAME = "";
    expect(isAfricaTalkingConfigured()).toBe(false);
  });

  it("returns false when both are missing", () => {
    process.env.AT_API_KEY = "";
    process.env.AT_USERNAME = "";
    expect(isAfricaTalkingConfigured()).toBe(false);
  });
});

describe("buildOtpMessage", () => {
  it("states the code in a form iOS and Android keyboards can suggest", () => {
    expect(buildOtpMessage("123456")).toContain("Your Ona code is 123456.");
  });

  it("adds the WebOTP last line so Chrome can auto-fill the code", () => {
    const msg = buildOtpMessage("123456", "https://ona.app");
    expect(msg.split("\n").pop()).toBe("@ona.app #123456");
  });

  it("uses the host only, keeps a port, and ignores a bad origin", () => {
    expect(buildOtpMessage("111111", "https://ona.vercel.app/some/path")).toMatch(/@ona\.vercel\.app #111111$/);
    expect(buildOtpMessage("111111", "http://localhost:3001")).toMatch(/@localhost:3001 #111111$/);
    expect(buildOtpMessage("111111", "not a url")).not.toContain("@");
  });

  it("stays within one 160-character SMS", () => {
    expect(buildOtpMessage("123456", "https://ona.vercel.app").length).toBeLessThanOrEqual(160);
  });
});

describe("sendAfricaTalkingSms", () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();

  const reply = (recipient: Record<string, unknown> | null, init: { ok?: boolean; status?: number } = {}) =>
    fetchMock.mockResolvedValueOnce({
      ok: init.ok ?? true,
      status: init.status ?? 201,
      text: async () =>
        JSON.stringify({ SMSMessageData: { Message: "Sent to 1/1", Recipients: recipient ? [recipient] : [] } }),
    });

  beforeEach(() => {
    process.env = { ...originalEnv, AT_USERNAME: "ona", AT_API_KEY: "secret-key" };
    delete process.env.AT_SENDER_ID;
    delete process.env.AT_BASE_URL;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("posts to the live gateway with the key in a header and normalises the number", async () => {
    reply({ statusCode: 101, status: "Success", messageId: "ATXid_1" });
    const res = await sendAfricaTalkingSms({ to: "08031234567", message: "hi" });
    expect(res).toEqual({ ok: true, messageId: "ATXid_1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.africastalking.com/version1/messaging");
    expect(init.headers.ApiKey).toBe("secret-key");
    expect(new URLSearchParams(init.body).get("to")).toBe("+2348031234567");
    expect(init.signal).toBeDefined();
  });

  it("uses the sandbox host for the sandbox username and sends the sender id when set", async () => {
    process.env.AT_USERNAME = "sandbox";
    process.env.AT_SENDER_ID = "ONA";
    reply({ statusCode: 101, status: "Success", messageId: "x" });
    await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.sandbox.africastalking.com/version1/messaging");
    expect(new URLSearchParams(init.body).get("from")).toBe("ONA");
  });

  it("treats queued as accepted", async () => {
    reply({ statusCode: 102, status: "Queued", messageId: "q" });
    expect((await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" })).ok).toBe(true);
  });

  it.each([
    [405, "InsufficientBalance"],
    [403, "InvalidPhoneNumber"],
    [402, "InvalidSenderId"],
    [406, "UserInBlacklist"],
  ])("reports a gateway refusal (%i %s) as a failure, never as sent", async (statusCode, status) => {
    reply({ statusCode, status });
    const res = await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" });
    expect(res).toEqual({ ok: false, error: status, statusCode });
  });

  it("fails when the gateway returns no recipient at all", async () => {
    reply(null);
    expect((await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" })).ok).toBe(false);
  });

  it("fails on an HTTP error, a network error and an invalid number without calling out", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => JSON.stringify({ message: "Invalid API key" }) });
    expect(await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" })).toEqual({ ok: false, error: "Invalid API key" });
    fetchMock.mockRejectedValueOnce(new Error("timed out"));
    expect(await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" })).toEqual({ ok: false, error: "timed out" });
    fetchMock.mockClear();
    expect((await sendAfricaTalkingSms({ to: "abc", message: "hi" })).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to send when credentials are missing", async () => {
    process.env.AT_API_KEY = "";
    const res = await sendAfricaTalkingSms({ to: "+2348031234567", message: "hi" });
    expect(res).toEqual({ ok: false, error: "Africa's Talking is not configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sendLoginOtpSms sends the WebOTP-formatted message", async () => {
    reply({ statusCode: 101, status: "Success", messageId: "m" });
    await sendLoginOtpSms({ to: "+2348031234567", code: "654321", origin: "https://ona.app" });
    const message = new URLSearchParams(fetchMock.mock.calls[0][1].body).get("message");
    expect(message).toContain("654321");
    expect(message?.endsWith("@ona.app #654321")).toBe(true);
  });
});

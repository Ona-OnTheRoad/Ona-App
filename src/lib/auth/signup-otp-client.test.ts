import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSignupPhoneCode, verifySignupPhoneCode } from "./signup-otp-client";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce({ status, json: async () => body });

describe("sendSignupPhoneCode", () => {
  it("posts the phone and returns the canonical number and resend gap", async () => {
    reply(200, { ok: true, data: { phone: "+2348031234567", resendInSec: 30 } });
    const res = await sendSignupPhoneCode("08031234567");
    expect(res).toEqual({ ok: true, phone: "+2348031234567", resendInSec: 30 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/otp/signup/send");
    expect(JSON.parse(init.body)).toEqual({ phone: "08031234567" });
  });

  it("falls back to a 30s gap when the server omits it", async () => {
    reply(200, { ok: true, data: { phone: "+2348031234567" } });
    expect(await sendSignupPhoneCode("x")).toMatchObject({ ok: true, resendInSec: 30 });
  });

  it("surfaces the server's code, message and wait time", async () => {
    reply(429, { ok: false, error: { code: "resend_wait", message: "Please wait 12s", retryAfterSec: 12 } });
    expect(await sendSignupPhoneCode("x")).toEqual({
      ok: false, error: "Please wait 12s", code: "resend_wait", retryAfterSec: 12,
    });
    reply(409, { ok: false, error: { code: "phone_in_use", message: "Already has an account" } });
    expect(await sendSignupPhoneCode("x")).toMatchObject({ ok: false, code: "phone_in_use" });
  });

  it("reports a network failure and an unreadable response without throwing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await sendSignupPhoneCode("x")).toMatchObject({ ok: false, code: "network" });
    fetchMock.mockResolvedValueOnce({ status: 502, json: async () => { throw new Error("html"); } });
    const res = await sendSignupPhoneCode("x");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/try again/i);
  });
});

describe("verifySignupPhoneCode", () => {
  it("returns the proof for the canonical number", async () => {
    reply(200, { ok: true, data: { phone: "+2348031234567", proof: "body.sig" } });
    expect(await verifySignupPhoneCode("08031234567", "482913")).toEqual({
      ok: true, phone: "+2348031234567", proof: "body.sig",
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ phone: "08031234567", code: "482913" });
  });

  it("never treats a response without a proof as success", async () => {
    reply(200, { ok: true, data: { phone: "+2348031234567" } });
    expect((await verifySignupPhoneCode("x", "111111")).ok).toBe(false);
  });

  it("surfaces wrong-code details", async () => {
    reply(401, { ok: false, error: { code: "otp_invalid", message: "Incorrect code.", failedAttempts: 2 } });
    expect(await verifySignupPhoneCode("x", "000000")).toEqual({
      ok: false, error: "Incorrect code.", code: "otp_invalid", failedAttempts: 2,
    });
  });

  it("reports a network failure without throwing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await verifySignupPhoneCode("x", "111111")).toMatchObject({ ok: false, code: "network" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const af = vi.hoisted(() => ({ authFetch: vi.fn() }));
vi.mock("@/lib/api-auth-headers", () => ({ authFetch: (...a: unknown[]) => af.authFetch(...a) }));

import { CODE_STEP_ERRORS, sendChangeContactCode } from "./change-contact-client";

const input = { channel: "phone" as const, target: "08077777777", identityProof: "P" };
beforeEach(() => { af.authFetch.mockReset(); });

describe("sendChangeContactCode", () => {
  it("posts to the authenticated send-code route with the proof", async () => {
    af.authFetch.mockResolvedValue({ json: async () => ({ ok: true, data: { resendInSec: 45 } }) });
    expect(await sendChangeContactCode(input)).toEqual({ ok: true, resendInSec: 45 });
    expect(af.authFetch.mock.calls[0][0]).toBe("/api/security/change-contact/send-code");
    expect(JSON.parse(af.authFetch.mock.calls[0][1].body)).toEqual(input);
  });
  it("defaults the resend gap when the server omits it", async () => {
    af.authFetch.mockResolvedValue({ json: async () => ({ ok: true, data: {} }) });
    expect(await sendChangeContactCode(input)).toEqual({ ok: true, resendInSec: 30 });
  });
  it("returns the server's message and code on failure", async () => {
    af.authFetch.mockResolvedValue({ json: async () => ({ ok: false, error: { message: "in use", code: "in_use" } }) });
    expect(await sendChangeContactCode(input)).toEqual({ ok: false, error: "in use", code: "in_use" });
  });
  it("handles an unreadable response without throwing", async () => {
    af.authFetch.mockResolvedValue({ json: async () => { throw new Error("bad json"); } });
    expect(await sendChangeContactCode(input)).toMatchObject({ ok: false });
  });
  it("handles a network error without throwing", async () => {
    af.authFetch.mockImplementation(async () => { throw new Error("offline"); });
    expect(await sendChangeContactCode(input)).toEqual({ ok: false, error: "Network error. Try again." });
  });
});

describe("CODE_STEP_ERRORS", () => {
  it("covers every server code that means 'retry the code', and nothing else", () => {
    expect([...CODE_STEP_ERRORS].sort()).toEqual(["code_required", "otp_expired", "otp_invalid", "otp_locked", "otp_missing"]);
    expect(CODE_STEP_ERRORS.has("in_use")).toBe(false);
    expect(CODE_STEP_ERRORS.has("identity_required")).toBe(false);
  });
});

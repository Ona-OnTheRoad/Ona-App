import { beforeEach, describe, expect, it, vi } from "vitest";

const authFetch = vi.fn();
vi.mock("@/lib/api-auth-headers", () => ({ authFetch }));

import { submitLivenessSelfie } from "../submit-selfie";

const body = { userId: "u1", selfie: "data:image/jpeg;base64,AAAA", challenges: ["smile"], durationMs: 5000 };
const json = (status: number, payload: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...headers } });

beforeEach(() => authFetch.mockReset());

describe("submitLivenessSelfie", () => {
  it("passes on a recorded server verdict", async () => {
    authFetch.mockResolvedValue(json(200, { ok: true, data: { recorded: true } }));
    expect(await submitLivenessSelfie(body)).toEqual({ ok: true });
  });

  it("returns the server wait from Retry-After on 429, not counted as a fail", async () => {
    authFetch.mockResolvedValue(
      json(429, { ok: false, error: { code: "rate_limited", message: "Too many verification attempts. Try again in about 26 minutes." } }, { "Retry-After": "1502" }),
    );
    expect(await submitLivenessSelfie(body)).toMatchObject({ ok: false, retryAfterSec: 1502, countsAsFail: false });
  });

  it("counts a provider rejection toward the local lockout, with no wait", async () => {
    authFetch.mockResolvedValue(json(422, { ok: false, error: { code: "liveness_failed", message: "Face check failed." } }));
    const r = await submitLivenessSelfie(body);
    expect(r).toMatchObject({ ok: false, countsAsFail: true });
    expect(r).not.toHaveProperty("retryAfterSec");
  });
});

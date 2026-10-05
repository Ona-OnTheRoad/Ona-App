import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_RELOGIN_MESSAGE } from "@/lib/supabase/session";

const getAppSupabase = vi.fn();
vi.mock("@/lib/supabase/app-client", () => ({
  getAppSupabase: () => getAppSupabase(),
}));

import { backendSaveIdentityVerification } from "@/lib/supabase/identity-submit";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  getAppSupabase.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const ok = () => ({ json: async () => ({ ok: true }) });
const base = {
  primaryId: "12345678901",
  govIdKind: "nin",
  govIdFrontUrl: "data:image/png;base64,AAAA",
};

describe("backendSaveIdentityVerification", () => {
  it("asks to sign in again instead of writing directly when there is no token", async () => {
    for (const accountType of ["motorist", "professional"] as const) {
      const err = await backendSaveIdentityVerification({
        ...base,
        accountType,
        accessToken: null,
      });
      expect(err).toBe(SESSION_RELOGIN_MESSAGE);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getAppSupabase).not.toHaveBeenCalled();
  });

  it("posts motorists to /api/verify/customer-id", async () => {
    fetchMock.mockResolvedValue(ok());
    const err = await backendSaveIdentityVerification({
      ...base,
      accountType: "motorist",
      bankId: "22222222222",
      accessToken: "tok-1234567890",
    });
    expect(err).toBeNull();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/verify/customer-id");
    expect(JSON.parse(init.body)).toMatchObject({
      access_token: "tok-1234567890",
      primaryId: "12345678901",
      bankId: "22222222222",
    });
  });

  it("posts pros to /api/verify/pro-id as gov_id", async () => {
    fetchMock.mockResolvedValue(ok());
    await backendSaveIdentityVerification({
      ...base,
      accountType: "professional",
      accessToken: "tok-1234567890",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/verify/pro-id");
    expect(JSON.parse(init.body)).toMatchObject({
      kind: "gov_id",
      govIdNumber: "12345678901",
      govIdKind: "nin",
    });
  });

  it("never sends verification flags from the client", async () => {
    fetchMock.mockResolvedValue(ok());
    await backendSaveIdentityVerification({
      ...base,
      accountType: "professional",
      accessToken: "tok-1234567890",
    });
    const body = fetchMock.mock.calls[0][1].body as string;
    expect(body).not.toMatch(/verified|review_status|identity_/);
  });

  it("returns the server's message on rejection and on network failure", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ ok: false, error: { message: "Invalid ID" } }),
    });
    expect(
      await backendSaveIdentityVerification({
        ...base,
        accountType: "motorist",
        accessToken: "tok-1234567890",
      }),
    ).toBe("Invalid ID");

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(
      await backendSaveIdentityVerification({
        ...base,
        accountType: "motorist",
        accessToken: "tok-1234567890",
      }),
    ).toBe("Network error submitting ID.");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/session", () => ({
  ensureAppSession: vi.fn(async () => null),
  SESSION_RELOGIN_MESSAGE: "Sign in again",
}));
vi.mock("@/lib/supabase/app-client", () => ({
  getAppSupabase: () => ({ auth: { setSession: vi.fn(), signInWithPassword: vi.fn() } }),
}));

import { backendSignUp } from "@/lib/supabase/app-api";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({
    ok: false,
    json: async () => ({ ok: false, error: { message: "stop here", code: "x" } }),
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const base = {
  email: "ada@ona.test", password: "Strong#Pass1", fullName: "Ada User", phone: "+2348012345678",
  gender: "female" as const, dateOfBirth: "1990-05-05",
};

const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);

describe("client signup request carries the phone proof (seam with POST /api/auth/signup)", () => {
  it.each(["motorist", "professional"] as const)("sends phoneProof for a %s signup", async (accountType) => {
    await backendSignUp({ ...base, accountType, phoneProof: "proof.sig" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/signup");
    expect(sentBody()).toMatchObject({ accountType, phone: "+2348012345678", phoneProof: "proof.sig" });
  });

  it("omits it when the user skipped verification (server then creates the account unverified)", async () => {
    await backendSignUp({ ...base, accountType: "motorist" });
    expect(sentBody().phoneProof).toBeUndefined();
  });

  it("never sends the password or proof anywhere except the signup endpoint", async () => {
    await backendSignUp({ ...base, accountType: "motorist", phoneProof: "proof.sig" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/signup");
  });

  it("surfaces the server's error and code so the UI can route on it", async () => {
    const res = await backendSignUp({ ...base, accountType: "motorist" });
    expect(res).toMatchObject({ error: "stop here", code: "x" });
  });
});

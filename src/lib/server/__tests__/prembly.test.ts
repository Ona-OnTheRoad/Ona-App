import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ID_LOOKUP_NOT_CONFIGURED,
  verifyBvnWithPrembly,
  verifyNinWithPrembly,
} from "@/lib/server/prembly";

const NUMBER = "12345678901";
const lookups = [
  { kind: "NIN", verify: verifyNinWithPrembly },
  { kind: "BVN", verify: verifyBvnWithPrembly },
] as const;

beforeEach(() => {
  for (const name of ["PREMBLY_API_KEY", "IDENTITYPASS_API_KEY"]) vi.stubEnv(name, "");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("no network in tests"); }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe.each(lookups)("$kind lookup without a provider key", ({ kind, verify }) => {
  it("fails closed in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const result = await verify(NUMBER);

    expect(result).toMatchObject({ ok: false, provider: "local", code: ID_LOOKUP_NOT_CONFIGURED });
    expect(result.ok === false && result.message).toMatch(new RegExp(`${kind} verification is not available`));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the format-only pass outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(await verify(NUMBER)).toMatchObject({
      ok: true, provider: "local", mode: "sandbox_format",
    });
    expect(await verify("11111111111")).toMatchObject({ ok: false, code: "FORMAT" });
  });

  it("rejects a wrong length before anything else, in any environment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await verify("123")).toMatchObject({ ok: false, code: "FORMAT" });
  });
});

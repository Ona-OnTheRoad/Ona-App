import { vi } from "vitest";

/**
 * Stand in for the bank's account-resolve endpoint (Flutterwave) in tests.
 * Sets a key so the real resolver runs, and answers its HTTP call.
 * Call `vi.unstubAllGlobals()` and `vi.unstubAllEnvs()` in afterEach.
 */
export type FakeBank = {
  mode: "resolved" | "not_found" | "unavailable" | "network";
  name: string;
  calls: { account_number: string; account_bank: string }[];
};

export function stubBankResolve(initial: Partial<FakeBank> = {}): FakeBank {
  const bank: FakeBank = { mode: "resolved", name: "ADA BANK HOLDER", calls: [], ...initial };
  vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "flw-test-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: unknown, init?: { body?: string }) => {
      if (!String(url).includes("/accounts/resolve")) {
        throw new Error(`unexpected fetch in test: ${String(url)}`);
      }
      const body = JSON.parse(init?.body || "{}");
      bank.calls.push(body);
      if (bank.mode === "network") throw new Error("socket hang up");
      if (bank.mode === "unavailable") return new Response("{}", { status: 502 });
      if (bank.mode === "not_found") {
        return new Response(
          JSON.stringify({ status: "error", message: "Sorry, that account number is invalid", data: null }),
          { status: 400 },
        );
      }
      return new Response(
        JSON.stringify({
          status: "success",
          data: { account_number: body.account_number, account_name: bank.name },
        }),
        { status: 200 },
      );
    }),
  );
  return bank;
}

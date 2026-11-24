import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), alert: vi.fn() }));

vi.mock("@/lib/server/payments/escrow-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/payments/escrow-store")>()),
  listEscrowsByStatuses: mocks.list,
}));
vi.mock("@/lib/server/payments/payout-alerts", () => ({
  checkPayoutFloatAndAlert: mocks.alert,
  markJobPayoutOnHold: vi.fn(),
}));

import { processDuePayoutRetries } from "../payout-settlement";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue([]);
  mocks.alert.mockResolvedValue({ checked: true, short: false });
});

describe("processDuePayoutRetries and the float alert", () => {
  it("checks the Flutterwave float on every run, even when nothing is due", async () => {
    const res = await processDuePayoutRetries(30);
    expect(res).toEqual({ checked: 0, succeeded: 0, stillPending: 0, failed: 0, ids: [] });
    expect(mocks.alert).toHaveBeenCalledTimes(1);
  });

  it("a failing alert can never break the payout retries", async () => {
    mocks.alert.mockRejectedValue(new Error("alerting down"));
    await expect(processDuePayoutRetries(30)).resolves.toMatchObject({ checked: 0, failed: 0 });
  });
});

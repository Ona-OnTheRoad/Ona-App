import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/server/security/cashout-engine", () => ({
  processDueCashoutRetries: vi.fn(async () => ({ retried: 1 })),
  verifyPendingCashouts: vi.fn(async () => ({ verified: 3 })),
}));

import {
  processDueCashoutRetries,
  verifyPendingCashouts,
} from "@/lib/server/security/cashout-engine";
import { GET, POST } from "@/app/api/security/cashout/verify/route";
import { bearer, describeSchedulerAuth, useSchedulerSecret } from "@/test-utils/scheduler-auth-cases";

const path = "/api/security/cashout/verify";

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET, POST },
  workRan: () =>
    vi.mocked(processDueCashoutRetries).mock.calls.length > 0 ||
    vi.mocked(verifyPendingCashouts).mock.calls.length > 0,
  acceptedStatus: 200,
  setup: () => vi.clearAllMocks(),
});

describe(`${path} after auth`, () => {
  useSchedulerSecret();

  it("runs retries and verification and returns both results", async () => {
    const res = await GET(bearer(path));
    expect(await res.json()).toEqual({
      ok: true,
      data: { retries: { retried: 1 }, verified: { verified: 3 } },
    });
  });
});

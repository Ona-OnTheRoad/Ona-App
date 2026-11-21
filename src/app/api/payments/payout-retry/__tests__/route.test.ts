import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/server/payments/payout-settlement", () => ({
  processDuePayoutRetries: vi.fn(async () => ({ checked: 2, released: 1 })),
}));
vi.mock("@/lib/server/admin-auth", async () => {
  class AdminAuthError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return { AdminAuthError, requirePermission: vi.fn() };
});

import { processDuePayoutRetries } from "@/lib/server/payments/payout-settlement";
import { AdminAuthError, requirePermission } from "@/lib/server/admin-auth";
import { GET, POST } from "@/app/api/payments/payout-retry/route";
import {
  bearer,
  describeSchedulerAuth,
  schedulerRequest,
  stubSchedulerSecret,
} from "@/test-utils/scheduler-auth-cases";

const path = "/api/payments/payout-retry";
const notAdmin = () =>
  vi.mocked(requirePermission).mockRejectedValue(
    new AdminAuthError("Not signed in", 401, "not_authenticated"),
  );

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET, POST },
  workRan: () => vi.mocked(processDuePayoutRetries).mock.calls.length > 0,
  acceptedStatus: 200,
  setup: () => {
    vi.clearAllMocks();
    notAdmin();
  },
});

describe(`${path} after auth`, () => {
  it("reports a scheduler run as source: cron without checking admin", async () => {
    stubSchedulerSecret();
    notAdmin();
    const res = await GET(bearer(path));
    expect(await res.json()).toEqual({
      ok: true,
      data: { checked: 2, released: 1, source: "cron" },
    });
    expect(requirePermission).not.toHaveBeenCalled();
    expect(processDuePayoutRetries).toHaveBeenCalledWith(30);
  });

  it("still lets an admin with escrow_release run it without a secret", async () => {
    stubSchedulerSecret();
    vi.mocked(requirePermission).mockResolvedValue(undefined as never);
    const res = await POST(schedulerRequest(path));
    expect(res.status).toBe(200);
    expect(requirePermission).toHaveBeenCalledWith("escrow_release");
    expect((await res.json()).data.source).toBe("admin");
  });

  it("returns the admin error to a signed-in user without escrow_release", async () => {
    stubSchedulerSecret();
    vi.mocked(processDuePayoutRetries).mockClear();
    vi.mocked(requirePermission).mockRejectedValue(
      new AdminAuthError("Missing permission", 403, "forbidden"),
    );
    const res = await GET(schedulerRequest(path));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("forbidden");
    expect(processDuePayoutRetries).not.toHaveBeenCalled();
  });
});

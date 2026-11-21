import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
const adminConfigured = vi.fn(() => true);
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => adminConfigured() }));
const rpc = vi.fn(async () => ({ data: 4, error: null as null | { message: string } }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => ({ rpc }) }));

import { GET } from "@/app/api/cron/purge-accounts/route";
import { bearer, describeSchedulerAuth, useSchedulerSecret } from "@/test-utils/scheduler-auth-cases";

const path = "/api/cron/purge-accounts";

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET },
  workRan: () => rpc.mock.calls.length > 0,
  acceptedStatus: 200,
  setup: () => {
    vi.clearAllMocks();
    adminConfigured.mockReturnValue(true);
  },
});

describe(`${path} after auth`, () => {
  useSchedulerSecret(() => adminConfigured.mockReturnValue(true));

  it("runs purge_expired_deletions and reports the count", async () => {
    const res = await GET(bearer(path));
    expect(rpc).toHaveBeenCalledWith("purge_expired_deletions");
    expect(await res.json()).toEqual({ ok: true, data: { purgedCount: 4 } });
  });

  it("keeps its 503 no_db check", async () => {
    adminConfigured.mockReturnValue(false);
    const res = await GET(bearer(path));
    expect(res.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });
});

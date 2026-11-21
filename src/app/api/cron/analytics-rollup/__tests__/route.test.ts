import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
// No database: once past auth the route stops at its existing 500, so the
// probe is whether it asked for the admin config at all.
const adminConfigured = vi.fn(() => false);
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => adminConfigured() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));

import { GET, POST } from "@/app/api/cron/analytics-rollup/route";
import { bearer, describeSchedulerAuth, useSchedulerSecret } from "@/test-utils/scheduler-auth-cases";

const path = "/api/cron/analytics-rollup";

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET, POST },
  workRan: () => adminConfigured.mock.calls.length > 0,
  acceptedStatus: 500,
  setup: () => vi.clearAllMocks(),
});

describe(`${path} after auth`, () => {
  useSchedulerSecret();

  it("keeps its existing 500 when Supabase is not configured", async () => {
    const res = await GET(bearer(path));
    expect(res.status).toBe(500);
    expect((await res.json()).error.message).toBe("Supabase not configured");
  });
});

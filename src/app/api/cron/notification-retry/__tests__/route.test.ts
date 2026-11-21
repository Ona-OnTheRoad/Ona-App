import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/server/notifications-retry", () => ({
  processDueNotificationRetries: vi.fn(async () => ({ processed: 2 })),
}));

import { processDueNotificationRetries } from "@/lib/server/notifications-retry";
import { GET, POST } from "@/app/api/cron/notification-retry/route";
import { bearer, describeSchedulerAuth, useSchedulerSecret } from "@/test-utils/scheduler-auth-cases";

const path = "/api/cron/notification-retry";

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET, POST },
  workRan: () => vi.mocked(processDueNotificationRetries).mock.calls.length > 0,
  acceptedStatus: 200,
  setup: () => vi.clearAllMocks(),
});

describe(`${path} after auth`, () => {
  useSchedulerSecret();

  it("returns the retry result unchanged", async () => {
    const res = await GET(bearer(path));
    expect(await res.json()).toEqual({ ok: true, data: { processed: 2 } });
  });
});

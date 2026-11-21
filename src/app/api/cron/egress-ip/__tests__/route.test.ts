import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/server/resend", () => ({ sendResendEmail: vi.fn() }));

import { GET, POST } from "@/app/api/cron/egress-ip/route";
import { bearer, describeSchedulerAuth, useSchedulerSecret } from "@/test-utils/scheduler-auth-cases";

const path = "/api/cron/egress-ip";
// The proxy probe is the route's first piece of work.
const fetchMock = vi.fn(async () =>
  Response.json({ data: { ip: "152.233.48.151" } }),
);

describeSchedulerAuth({
  route: path,
  path,
  handlers: { GET, POST },
  workRan: () => fetchMock.mock.calls.length > 0,
  acceptedStatus: 200,
  setup: () => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FLUTTERWAVE_EGRESS_IPS", "");
  },
});

describe(`${path} after auth`, () => {
  useSchedulerSecret(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FLUTTERWAVE_EGRESS_IPS", "");
  });

  it("reports a whitelisted egress IP as known", async () => {
    const res = await GET(bearer(path));
    expect(await res.json()).toMatchObject({
      ok: true,
      data: { ok: true, ip: "152.233.48.151", known: true },
    });
  });
});

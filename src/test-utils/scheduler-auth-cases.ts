/**
 * Shared auth cases for routes gated by hasSchedulerSecret().
 *
 * Each route test calls this with its handler and a probe that says whether
 * the route's work ran. Every refused case must return 401 with no work done;
 * the two accepted header forms must get past auth.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

export const TEST_SCHEDULER_SECRET = "scheduler-route-test-secret";

type Handler = (req: Request) => Promise<Response>;

export function schedulerRequest(path: string, headers: HeadersInit = {}, query = ""): Request {
  return new Request(`http://localhost${path}${query}`, { headers });
}

export function bearer(path: string): Request {
  return schedulerRequest(path, { authorization: `Bearer ${TEST_SCHEDULER_SECRET}` });
}

export function stubSchedulerSecret(): void {
  vi.stubEnv("CRON_SECRET", TEST_SCHEDULER_SECRET);
  vi.stubEnv("ONA_CRON_SECRET", "");
  vi.stubEnv("JOB_EXPIRE_SECRET", "");
}

/** For a describe block outside describeSchedulerAuth: secret set, mocks cleared. */
export function useSchedulerSecret(setup?: () => void): void {
  beforeEach(() => {
    vi.clearAllMocks();
    stubSchedulerSecret();
    setup?.();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
}

export function describeSchedulerAuth(opts: {
  route: string;
  path: string;
  handlers: Record<string, Handler>;
  workRan: () => boolean;
  /** Status the route returns once past auth with the test mocks in place. */
  acceptedStatus: number;
  setup?: () => void;
}): void {
  const { path } = opts;
  describe(`${opts.route} scheduler auth`, () => {
    beforeEach(() => {
      stubSchedulerSecret();
      opts.setup?.();
    });
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    for (const [method, handler] of Object.entries(opts.handlers)) {
      const refused: Array<[string, () => Request]> = [
        ["no secret", () => schedulerRequest(path)],
        ["a wrong bearer", () => schedulerRequest(path, { authorization: "Bearer wrong" })],
        ["a near-miss x-cron-secret", () =>
          schedulerRequest(path, { "x-cron-secret": TEST_SCHEDULER_SECRET.slice(0, -1) })],
        ["the secret in ?secret=", () =>
          schedulerRequest(path, {}, `?secret=${TEST_SCHEDULER_SECRET}`)],
        ["a vercel-cron user agent", () =>
          schedulerRequest(path, { "user-agent": "vercel-cron/1.0" })],
      ];

      it.each(refused)(`${method} refuses %s and does no work`, async (_label, make) => {
        expect((await handler(make())).status).toBe(401);
        expect(opts.workRan()).toBe(false);
      });

      it(`${method} fails closed when no secret is configured, even in development`, async () => {
        vi.stubEnv("CRON_SECRET", "");
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("ALLOW_OPEN_PAYOUT_CRON", "true");
        vi.stubEnv("VERCEL", "1");
        expect((await handler(schedulerRequest(path, { "user-agent": "vercel-cron/1.0" }))).status).toBe(401);
        expect((await handler(bearer(path))).status).toBe(401);
        expect(opts.workRan()).toBe(false);
      });

      it(`${method} accepts Authorization: Bearer`, async () => {
        expect((await handler(bearer(path))).status).toBe(opts.acceptedStatus);
        expect(opts.workRan()).toBe(true);
      });

      it(`${method} accepts x-cron-secret`, async () => {
        const res = await handler(schedulerRequest(path, { "x-cron-secret": TEST_SCHEDULER_SECRET }));
        expect(res.status).toBe(opts.acceptedStatus);
        expect(opts.workRan()).toBe(true);
      });
    }
  });
}

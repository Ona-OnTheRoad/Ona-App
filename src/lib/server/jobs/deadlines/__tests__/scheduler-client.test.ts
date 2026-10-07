import { describe, expect, it, vi } from "vitest";
import { schedulerConfig, runDeadlineSweep } from "../../../../../../scripts/run-deadline-sweep.mjs";

describe("portable unattended scheduler client", () => {
  it.each(["http://example.com", "https://user:secret@example.com", "https://example.com/?secret=token", "https://example.com/path"])("rejects unsafe origin %s", (origin) => {
    expect(() => schedulerConfig({ DEADLINE_SWEEP_BASE_URL: origin, CRON_SECRET: "secret" })).toThrow();
  });
  it("requires a configured secret and defaults to local port 3100", () => {
    expect(() => schedulerConfig({})).toThrow();
    expect(schedulerConfig({ CRON_SECRET: "secret" }).url.href).toBe("http://localhost:3100/api/jobs/deadline-sweep");
  });
  it("sends secrets only in headers, refuses redirects and reports completed counts", async () => {
    const fetcher = vi.fn(async () => Response.json({ ok: true, data: { outcomes: {
      pairing: { status: "completed", checked: 2, timedOut: 1, expired: 0 },
      negotiation: { status: "completed", checked: 1, expired: 1 },
    } } }));
    const config = schedulerConfig({ DEADLINE_SWEEP_BASE_URL: "https://dev.example.com", CRON_SECRET: "test-secret" });
    expect(await runDeadlineSweep(config, fetcher)).toMatchObject({ negotiation: { checked: 1, expired: 1 } });
    expect(fetcher).toHaveBeenCalledWith(config.url, expect.objectContaining({
      method: "POST", redirect: "error", headers: { Authorization: "Bearer test-secret" }, signal: expect.any(AbortSignal),
    }));
  });
  it.each([401, 503])("surfaces HTTP %s without echoing server error payloads", async (status) => {
    const fetcher = vi.fn(async () => Response.json({ error: "private error" }, { status }));
    await expect(runDeadlineSweep(schedulerConfig({ CRON_SECRET: "secret" }), fetcher)).rejects.toThrow(`HTTP ${status}`);
  });
  it("rejects a misleading 200 without completed scope results", async () => {
    await expect(runDeadlineSweep(schedulerConfig({ CRON_SECRET: "secret" }), async () => Response.json({ ok: true }))).rejects.toThrow("completion");
  });
});

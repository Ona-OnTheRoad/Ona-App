// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { backendSubscribeJobs } from "@/lib/supabase/app-api";
import { clearJobDiagnostics, jobDiagnosticsSnapshot, startJobDiagnostics, stopJobDiagnostics } from "../collector";
const mocks = vi.hoisted(() => ({ client: vi.fn(), channel: vi.fn(), on: vi.fn(), subscribe: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/supabase/app-client", () => ({ getAppSupabase: mocks.client, isAppBackendOnline: vi.fn() }));
const channel = { on: mocks.on, subscribe: mocks.subscribe };
beforeEach(() => {
  vi.clearAllMocks(); stopJobDiagnostics(); clearJobDiagnostics();
  mocks.on.mockReturnValue(channel); mocks.subscribe.mockReturnValue(channel);
  mocks.channel.mockReturnValue(channel); mocks.client.mockReturnValue({ channel: mocks.channel, removeChannel: mocks.remove });
});
afterEach(stopJobDiagnostics);
it("preserves exactly one channel, both user filters, payload delivery and cleanup with diagnostics off", () => {
  const changed = vi.fn(); const remove = backendSubscribeJobs("private-user", changed, "incoming");
  expect(mocks.channel).toHaveBeenCalledTimes(1); expect(mocks.on).toHaveBeenCalledTimes(2);
  expect(mocks.on.mock.calls.map((args) => args[1].filter)).toEqual(["motorist_id=eq.private-user", "repair_pro_id=eq.private-user"]);
  const payload = { new: { id: "private-job", phone: "private-phone" } };
  mocks.on.mock.calls[0][2](payload); expect(changed).toHaveBeenCalledWith(payload);
  remove?.(); expect(mocks.remove).toHaveBeenCalledWith(channel); expect(jobDiagnosticsSnapshot().retained).toBe(0);
});
it("records readiness, errors, recovery and events without channel names, identities or row data", () => {
  startJobDiagnostics("reconnect");
  const remove = backendSubscribeJobs("private-user", vi.fn(), "cloud-store");
  const status = mocks.subscribe.mock.calls[0][0];
  status("SUBSCRIBED"); status("CHANNEL_ERROR", new Error("secret")); status("SUBSCRIBED");
  mocks.on.mock.calls[1][2]({ new: { id: "private-job", coordinates: "private-location" } }); remove?.();
  expect(jobDiagnosticsSnapshot().events.map((e) => e.outcome)).toEqual(["opened", "subscribed", "channel-error", "subscribed", "event", "removed"]);
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toMatch(/private|secret/);
});

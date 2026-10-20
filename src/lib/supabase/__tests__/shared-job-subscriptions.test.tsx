// @vitest-environment jsdom
import { StrictMode, useEffect } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { backendSubscribeJobs } from "../app-api";
import type { JobChangeListener } from "../shared-job-subscriptions";
import { beginJobDiagnostic, clearJobDiagnostics, jobDiagnosticsSnapshot, startJobDiagnostics, stopJobDiagnostics } from "@/lib/jobs/diagnostics/collector";
import type { JobSource } from "@/lib/jobs/diagnostics/types";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/app-client", () => ({ getAppSupabase: mocks.client, isAppBackendOnline: vi.fn() }));
type Payload = { new?: Record<string, unknown>; old?: Record<string, unknown> };
function fakeClient() {
  const channels: ReturnType<typeof fakeChannel>[] = [];
  const removeChannel = vi.fn().mockResolvedValue("ok");
  const channel = vi.fn(() => { const next = fakeChannel(); channels.push(next); return next; });
  return { channel, removeChannel, channels };
}
function fakeChannel() {
  const on = vi.fn().mockReturnThis();
  const subscribe = vi.fn().mockReturnThis();
  return {
    on, subscribe,
    event: (payload: Payload | null = { new: { id: "private-job" } }, filter = 0) => on.mock.calls[filter][2](payload),
    status: (status: string) => subscribe.mock.calls[0][0](status),
  };
}
let client: ReturnType<typeof fakeClient>;
let disposers: Array<() => void>;
function subscribe(user = "private-user", listener = vi.fn(), source: JobSource = "job-screen") {
  const remove = backendSubscribeJobs(user, listener, source);
  if (remove) disposers.push(remove);
  return remove;
}
beforeEach(() => {
  client = fakeClient(); mocks.client.mockReturnValue(client); disposers = [];
  stopJobDiagnostics(); clearJobDiagnostics();
});
afterEach(() => {
  cleanup(); for (const remove of disposers) remove();
  stopJobDiagnostics(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

it("shares one channel across all four consumers and retains the exact user filters", () => {
  const listeners = Array.from({ length: 4 }, () => vi.fn());
  ["cloud-store", "job-screen", "dashboard", "incoming"].forEach((source, i) => {
    subscribe("private-user", listeners[i], source as JobSource);
  });
  expect(client.channel).toHaveBeenCalledTimes(1);
  expect(client.channels[0].on.mock.calls.map((call) => call[1])).toEqual([
    { event: "*", schema: "public", table: "service_requests", filter: "motorist_id=eq.private-user" },
    { event: "*", schema: "public", table: "service_requests", filter: "repair_pro_id=eq.private-user" },
  ]);
  const payload = { new: { id: "private-job" }, old: { status: "pending" } };
  client.channels[0].event(payload); client.channels[0].event(null, 1);
  for (const listener of listeners) {
    expect(listener.mock.calls).toEqual([[payload], [undefined]]);
  }
  expect(jobDiagnosticsSnapshot().retained).toBe(0);
});

it("keeps remaining listeners alive and removes the channel exactly once at last cleanup", () => {
  const first = vi.fn(), second = vi.fn();
  const removeFirst = subscribe("user", first), removeSecond = subscribe("user", second);
  removeFirst?.(); removeFirst?.();
  client.channels[0].event();
  expect(first).not.toHaveBeenCalled(); expect(second).toHaveBeenCalledTimes(1);
  expect(client.removeChannel).not.toHaveBeenCalled();
  removeSecond?.(); removeSecond?.();
  expect(client.removeChannel).toHaveBeenCalledExactlyOnceWith(client.channels[0]);
  client.channels[0].event(); expect(second).toHaveBeenCalledTimes(1);
});

it("treats duplicate callbacks as independent registrations", () => {
  const listener = vi.fn();
  const first = subscribe("user", listener); subscribe("user", listener);
  first?.(); client.channels[0].event();
  expect(listener).toHaveBeenCalledTimes(1); expect(client.removeChannel).not.toHaveBeenCalled();
});

it("isolates users and Supabase client instances", () => {
  const first = vi.fn(), second = vi.fn(), replacement = vi.fn();
  subscribe("user-a", first); subscribe("user-b", second);
  const other = fakeClient(); mocks.client.mockReturnValue(other); subscribe("user-a", replacement);
  client.channels[0].event(); expect(first).toHaveBeenCalledTimes(1);
  expect(second).not.toHaveBeenCalled(); expect(replacement).not.toHaveBeenCalled();
  client.channels[1].event(); other.channels[0].event();
  expect(second).toHaveBeenCalledTimes(1); expect(replacement).toHaveBeenCalledTimes(1);
  expect(client.channel).toHaveBeenCalledTimes(2); expect(other.channel).toHaveBeenCalledTimes(1);
});

it("resubscribes immediately and rejects late events/status from the removed generation", () => {
  startJobDiagnostics();
  const oldListener = vi.fn(), nextListener = vi.fn();
  const remove = subscribe("user", oldListener); remove?.(); subscribe("user", nextListener);
  const before = jobDiagnosticsSnapshot().retained;
  client.channels[0].event(); client.channels[0].status("SUBSCRIBED"); remove?.();
  expect(jobDiagnosticsSnapshot().retained).toBe(before);
  expect(oldListener).not.toHaveBeenCalled(); expect(nextListener).not.toHaveBeenCalled();
  client.channels[1].event(); expect(nextListener).toHaveBeenCalledTimes(1);
  expect(client.channel).toHaveBeenCalledTimes(2);
});

it("isolates a throwing consumer and records only a fixed error outcome", () => {
  startJobDiagnostics();
  subscribe("user", vi.fn(() => { throw new Error("private-secret"); }));
  const other = vi.fn(); subscribe("user", other, "incoming");
  expect(() => client.channels[0].event()).not.toThrow(); expect(other).toHaveBeenCalledTimes(1);
  const snapshot = jobDiagnosticsSnapshot();
  expect(snapshot.events.some((e) => e.kind === "subscription-consumer" && e.outcome === "error")).toBe(true);
  expect(JSON.stringify(snapshot)).not.toMatch(/private|secret/);
});

it("skips a listener removed during delivery and defers a newly registered listener", () => {
  const removed = vi.fn(), added = vi.fn();
  subscribe("user", vi.fn(() => { removeSecond?.(); subscribe("user", added); }));
  const removeSecond = subscribe("user", removed);
  client.channels[0].event(); expect(removed).not.toHaveBeenCalled(); expect(added).not.toHaveBeenCalled();
  client.channels[0].event(); expect(added).toHaveBeenCalledTimes(1);
});

it("counts physical lifecycle once while retaining each consumer's event-to-read timing", () => {
  startJobDiagnostics();
  const first = subscribe("user", vi.fn(), "cloud-store");
  subscribe("user", vi.fn(), "incoming");
  client.channels[0].status("SUBSCRIBED"); client.channels[0].status("CHANNEL_ERROR");
  client.channels[0].status("SUBSCRIBED"); client.channels[0].event();
  beginJobDiagnostic("http", "jobs", { source: "incoming", trigger: "realtime" })("ok");
  first?.();
  const events = jobDiagnosticsSnapshot().events;
  expect(events.filter((e) => e.kind === "subscription").map((e) => e.outcome))
    .toEqual(["opened", "subscribed", "channel-error", "subscribed", "event"]);
  expect(events.filter((e) => e.kind === "subscription-consumer" && e.outcome === "event").map((e) => e.source))
    .toEqual(["cloud-store", "incoming"]);
  expect(events.find((e) => e.kind === "http")?.eventToResponseMs).toBeTypeOf("number");
});

it("returns null without a backend or browser and opens no channel", () => {
  mocks.client.mockReturnValue(null); expect(subscribe()).toBeNull();
  mocks.client.mockReturnValue(client); vi.stubGlobal("window", undefined);
  expect(subscribe()).toBeNull(); expect(client.channel).not.toHaveBeenCalled();
});

it("cleans up a failed setup so a subsequent subscription can retry", () => {
  client.channel.mockImplementationOnce(() => {
    const channel = fakeChannel(); channel.subscribe.mockImplementation(() => { throw new Error("setup failed"); });
    return channel;
  });
  expect(() => subscribe()).toThrow("setup failed");
  expect(client.removeChannel).toHaveBeenCalledTimes(1);
  subscribe(); expect(client.channel).toHaveBeenCalledTimes(2);
  client.channels[0].event();
});

it("handles asynchronous channel removal rejection without retaining the old entry", async () => {
  startJobDiagnostics(); client.removeChannel.mockRejectedValueOnce(new Error("private-secret"));
  const remove = subscribe(); remove?.(); subscribe(); await Promise.resolve();
  expect(client.channel).toHaveBeenCalledTimes(2);
  expect(jobDiagnosticsSnapshot().events.some((e) => e.kind === "subscription" && e.outcome === "error")).toBe(true);
  expect(JSON.stringify(jobDiagnosticsSnapshot())).not.toContain("private-secret");
});

function Consumer({ user, onChange }: { user: string; onChange: JobChangeListener }) {
  useEffect(() => backendSubscribeJobs(user, onChange) ?? undefined, [user, onChange]);
  return null;
}
it("cleans up Strict Mode remounts, navigation and account switching without stale delivery", () => {
  const listener = vi.fn();
  const view = render(<StrictMode><Consumer user="old-user" onChange={listener} /></StrictMode>);
  expect(client.channel).toHaveBeenCalledTimes(2); // first Strict Mode effect was cleaned up
  client.channels[0].event(); expect(listener).not.toHaveBeenCalled();
  client.channels[1].event(); expect(listener).toHaveBeenCalledTimes(1);
  view.rerender(<StrictMode><Consumer user="next-user" onChange={listener} /></StrictMode>);
  client.channels[1].event(); expect(listener).toHaveBeenCalledTimes(1);
  client.channels[2].event(); expect(listener).toHaveBeenCalledTimes(2);
  view.unmount(); client.channels[2].event(); expect(listener).toHaveBeenCalledTimes(2);
  expect(client.removeChannel).toHaveBeenCalledTimes(3);
});

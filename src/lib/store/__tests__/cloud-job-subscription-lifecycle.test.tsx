// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCloudRealtime } from "../use-cloud-realtime";

const mocks = vi.hoisted(() => ({ subscribe: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/supabase/app-api", () => ({
  backendSubscribeJobs: mocks.subscribe,
  backendSubscribePros: () => null,
  backendSubscribeUserMessageInserts: () => null,
  isAppBackendOnline: () => true,
}));
type Args = Parameters<typeof useCloudRealtime>;
const refreshCloudJobs = vi.fn();
const market = { setCloudTechs: vi.fn() } as unknown as Args[1];
const cloud = { refreshCloudJobs, refreshCloudPros: vi.fn(), refreshCloudChats: vi.fn() } as unknown as Args[2];
const signedIn = { isAuthenticated: true, backendUserId: "old-user", accountType: "motorist" };
function draw() {
  return renderHook((session) => useCloudRealtime(session as Args[0], market, cloud), { initialProps: signedIn });
}
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); mocks.subscribe.mockReturnValue(mocks.remove); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("removes the consumer and pending event refresh on sign-out even if user ID is retained", () => {
  const view = draw();
  act(() => mocks.subscribe.mock.calls[0][1]());
  view.rerender({ ...signedIn, isAuthenticated: false });
  expect(mocks.remove).toHaveBeenCalledTimes(1);
  expect(mocks.subscribe).toHaveBeenCalledTimes(1);
  act(() => { vi.advanceTimersByTime(120_000); });
  expect(refreshCloudJobs).not.toHaveBeenCalled();
});

it("releases the prior user and cancels its queued event when the account changes", () => {
  const view = draw(); act(() => mocks.subscribe.mock.calls[0][1]());
  view.rerender({ ...signedIn, backendUserId: "next-user" });
  expect(mocks.remove).toHaveBeenCalledTimes(1);
  expect(mocks.subscribe.mock.calls.map((call) => call[0])).toEqual(["old-user", "next-user"]);
  act(() => { vi.advanceTimersByTime(800); });
  expect(refreshCloudJobs).not.toHaveBeenCalled();
  view.unmount(); expect(mocks.remove).toHaveBeenCalledTimes(2);
});

it("rebinds the consumer on a role switch and cancels the old role's queued refresh", () => {
  const view = draw(); act(() => mocks.subscribe.mock.calls[0][1]());
  view.rerender({ ...signedIn, accountType: "professional" });
  expect(mocks.remove).toHaveBeenCalledTimes(1); expect(mocks.subscribe).toHaveBeenCalledTimes(2);
  act(() => { vi.advanceTimersByTime(800); });
  expect(refreshCloudJobs).not.toHaveBeenCalled();
});

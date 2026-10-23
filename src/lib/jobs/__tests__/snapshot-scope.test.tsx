// @vitest-environment jsdom
import { useEffect } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useSnapshotScope } from "../use-snapshot-scope";
afterEach(cleanup);
it("shares lanes across consumers and lets a survivor continue after another unmounts", async () => {
  let resolve!: (value: number) => void;
  const read = vi.fn(() => new Promise<number>((done) => { resolve = done; }));
  const a = renderHook(() => useSnapshotScope("A", "motorist", true));
  const b = renderHook(() => useSnapshotScope("A", "motorist", true));
  const ac = a.result.current.capture()!; const bc = b.result.current.capture()!;
  const first = ac.read("job:j", read);
  expect(bc.read("job:j", read)).toBe(first);
  await act(async () => { await Promise.resolve(); });
  a.unmount(); expect(ac.isCurrent()).toBe(false); expect(bc.isCurrent()).toBe(true);
  resolve(1); expect(await first).toBe(1); expect(read).toHaveBeenCalledTimes(1);
});
it("isolates users, roles and returning generations", async () => {
  const h = renderHook(({ user, role }) => useSnapshotScope(user, role, true),
    { initialProps: { user: "A", role: "motorist" } });
  const old = h.result.current.capture()!;
  h.rerender({ user: "B", role: "motorist" });
  h.rerender({ user: "A", role: "professional" });
  h.rerender({ user: "A", role: "motorist" });
  expect(old.isCurrent()).toBe(false); expect(h.result.current.capture()!.isCurrent()).toBe(true);
});
it("drops a departing resource's queued read even while another scope owner stays mounted", async () => {
  let resolve!: (value: number) => void;
  const a = renderHook(() => useSnapshotScope("A", "motorist", true, "job:a"));
  const survivor = renderHook(() => useSnapshotScope("A", "motorist", true, "cloud"));
  const capture = a.result.current.capture()!;
  const first = capture.read("job:a", () => new Promise<number>((done) => { resolve = done; }));
  await act(async () => { await Promise.resolve(); });
  const read = vi.fn(async () => 2);
  const follow = capture.read("job:a", read, true);
  const error = expect(follow).rejects.toThrow("scope ended");
  a.unmount(); resolve(1); await first; await error;
  expect(read).not.toHaveBeenCalled(); expect(survivor.result.current.capture()!.isCurrent()).toBe(true);
});
it("keeps queued work if another interested consumer survives", async () => {
  let resolve!: (value: number) => void;
  const a = renderHook(() => useSnapshotScope("A", "motorist", true));
  const b = renderHook(() => useSnapshotScope("A", "motorist", true));
  const ac = a.result.current.capture()!; const bc = b.result.current.capture()!;
  const first = ac.read("job", () => new Promise<number>((done) => { resolve = done; }));
  await act(async () => { await Promise.resolve(); });
  const gone = vi.fn(async () => 2); const live = vi.fn(async () => 3);
  const follow = ac.read("job", gone, true);
  expect(bc.read("job", live, true)).toBe(follow);
  a.unmount(); resolve(1); await first; expect(await follow).toBe(3);
  expect(gone).not.toHaveBeenCalled(); expect(live).toHaveBeenCalledTimes(1);
});

it("retires the old effect generation during Strict Mode replay", async () => {
  const captures: ReturnType<ReturnType<typeof useSnapshotScope>["capture"]>[] = [];
  // Capture during an effect, so Strict Mode exercises actual setup/cleanup.
  const h = renderHook(() => {
    const scope = useSnapshotScope("A", "motorist", true);
    useEffect(() => { captures.push(scope.capture()); }, [scope]);
    return scope;
  }, { reactStrictMode: true });
  expect(captures.length).toBe(2);
  expect(captures[0]!.isCurrent()).toBe(false); expect(captures[1]!.isCurrent()).toBe(true);
  h.unmount(); expect(captures[1]!.isCurrent()).toBe(false);
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLockCountdown } from "../use-lock-countdown";
import type { LivenessPhase } from "../types";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useLockCountdown", () => {
  it("counts down live and calls onExpire when the wait ends", () => {
    const onExpire = vi.fn();
    const { result, rerender } = renderHook(
      ({ phase }: { phase: LivenessPhase }) => useLockCountdown(phase, onExpire),
      { initialProps: { phase: "run" as LivenessPhase } },
    );
    act(() => result.current.setLockMs(66_000));
    rerender({ phase: "locked" });
    expect(result.current.lockLabel).toBe("1m 06s");

    act(() => void vi.advanceTimersByTime(7_000));
    expect(result.current.lockLabel).toBe("59s");

    act(() => void vi.advanceTimersByTime(59_000));
    expect(result.current.lockMs).toBe(0);
    expect(result.current.lockLabel).toBe("");
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does not tick outside the locked phase", () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useLockCountdown("fail", onExpire));
    act(() => result.current.setLockMs(5_000));
    act(() => void vi.advanceTimersByTime(10_000));
    expect(result.current.lockLabel).toBe("5s");
    expect(onExpire).not.toHaveBeenCalled();
  });
});

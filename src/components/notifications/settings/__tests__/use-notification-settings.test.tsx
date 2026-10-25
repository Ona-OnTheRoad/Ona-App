// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNotificationSettings } from "../use-notification-settings";
import { hasPendingSync, writeSettings, DEFAULT_SETTINGS } from "../storage";
import { authFetch } from "@/lib/api-auth-headers";

vi.mock("@/lib/api-auth-headers", () => ({
  authFetch: vi.fn(),
}));

describe("useNotificationSettings hook", () => {
  const userKey = "test-user-123";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1. keeps dirty=true and records pending sync when PATCH fails", async () => {
    // Initial GET returns empty
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: {} }),
    } as Response);

    const { result } = renderHook(() => useNotificationSettings(userKey));

    // Flush initial GET
    await act(async () => {
      await Promise.resolve();
    });

    // Make PATCH fail
    vi.mocked(authFetch).mockRejectedValueOnce(new Error("Network down"));

    act(() => {
      result.current.patchCategory("promotional", true);
    });

    // Advance past debounce 500ms
    await act(async () => {
      vi.advanceTimersByTime(550);
      await Promise.resolve();
    });

    expect(result.current.dirty).toBe(true);
    expect(hasPendingSync(userKey)).toBe(true);
  });

  it("2. handleSave shows informative fallback toast and keeps dirty=true on failure", async () => {
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: {} }),
    } as Response);

    const { result } = renderHook(() => useNotificationSettings(userKey));
    await act(async () => {
      await Promise.resolve();
    });

    // User toggles something
    act(() => {
      result.current.patch({ enabled: false });
    });

    // Mock failure for handleSave's sync
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.toast).toBe(
      "Saved on device. Will sync to server when connected.",
    );
    expect(result.current.dirty).toBe(true);

    // Now test success case
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.toast).toBe("All preferences saved");
    expect(result.current.dirty).toBe(false);
  });

  it("3. automatically retries pending sync when device comes back online", async () => {
    // Initial GET
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: {} }),
    } as Response);

    const { result } = renderHook(() => useNotificationSettings(userKey));
    await act(async () => {
      await Promise.resolve();
    });

    // PATCH fails while offline
    vi.mocked(authFetch).mockRejectedValueOnce(new Error("Offline"));
    act(() => {
      result.current.patchDelivery("sms", true);
    });

    await act(async () => {
      vi.advanceTimersByTime(550);
      await Promise.resolve();
    });

    expect(result.current.dirty).toBe(true);
    expect(hasPendingSync(userKey)).toBe(true);

    // Mock successful reconnect PATCH
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    // Dispatch online event
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await Promise.resolve();
    });

    expect(result.current.dirty).toBe(false);
    expect(hasPendingSync(userKey)).toBe(false);
  });

  it("4. flushes pending debounce change with keepalive: true on unmount", async () => {
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: {} }),
    } as Response);

    const { result, unmount } = renderHook(() =>
      useNotificationSettings(userKey),
    );
    await act(async () => {
      await Promise.resolve();
    });

    // Toggle something (starts 500ms debounce)
    act(() => {
      result.current.patchCategory("messages", false);
    });

    // Mock unmount keepalive PATCH
    vi.mocked(authFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    // Unmount at 200ms (before debounce expires)
    act(() => {
      vi.advanceTimersByTime(200);
      unmount();
    });

    // Check that authFetch was called with keepalive: true and latestState
    const patchCalls = vi.mocked(authFetch).mock.calls.filter(
      ([url, init]) => init?.method === "PATCH",
    );
    expect(patchCalls.length).toBeGreaterThan(0);
    const lastPatchCall = patchCalls[patchCalls.length - 1];
    expect(lastPatchCall[1]?.keepalive).toBe(true);
    expect(JSON.parse(lastPatchCall[1]?.body as string).categories.messages).toBe(
      false,
    );
  });

  it("5. does not overwrite user edits if initial GET resolves after user interacted", async () => {
    let resolveGet: (val: unknown) => void = () => {};
    const delayedGetPromise = new Promise((resolve) => {
      resolveGet = resolve;
    });

    // Initial GET hangs
    vi.mocked(authFetch).mockReturnValueOnce(
      delayedGetPromise as Promise<Response>,
    );

    const { result } = renderHook(() => useNotificationSettings(userKey));

    // User immediately toggles a setting while GET is in flight
    act(() => {
      result.current.patchCategory("payments", false);
    });

    expect(result.current.state.categories.payments).toBe(false);

    // Now resolve the delayed initial GET with remote data claiming payments: true
    await act(async () => {
      resolveGet({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            categories: { payments: true },
          },
        }),
      });
      await Promise.resolve();
    });

    // User's toggle must NOT be overwritten!
    expect(result.current.state.categories.payments).toBe(false);
  });
});

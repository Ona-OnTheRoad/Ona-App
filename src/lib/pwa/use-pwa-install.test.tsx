// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NUDGE_STORE_KEY } from "./install";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

function setup(opts: { ua: string; standalone?: boolean; stored?: object }) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: opts.ua,
    configurable: true,
  });
  window.matchMedia = ((q: string) => ({
    matches: Boolean(opts.standalone) && q.includes("standalone"),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  localStorage.clear();
  sessionStorage.clear();
  // One earlier visit already recorded; this mount counts the second.
  localStorage.setItem(
    NUDGE_STORE_KEY,
    JSON.stringify({
      visits: 1,
      installed: false,
      dismissCount: 0,
      lastDismissedAt: 0,
      ...opts.stored,
    }),
  );
}

const loadHook = async () => (await import("./use-pwa-install")).usePwaInstall;
const store = () => JSON.parse(localStorage.getItem(NUDGE_STORE_KEY) || "{}");

function fireInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const evt = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome }),
    },
  );
  act(() => {
    window.dispatchEvent(evt);
  });
  return evt;
}

describe("usePwaInstall", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  it("Android: offers the native prompt after a repeat visit", async () => {
    setup({ ua: ANDROID });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.mode).toBeNull();
    const evt = fireInstallPrompt();
    expect(evt.defaultPrevented).toBe(true);
    expect(result.current.mode).toBe("prompt");
    expect(store().visits).toBe(2);
  });

  it("accepting the prompt marks Ona installed and stops the nudge", async () => {
    setup({ ua: ANDROID });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    fireInstallPrompt("accepted");
    await act(async () => {
      expect(await result.current.promptInstall()).toBe("accepted");
    });
    expect(store().installed).toBe(true);
    expect(result.current.mode).toBeNull();
  });

  it("declining snoozes instead of marking installed", async () => {
    setup({ ua: ANDROID });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    fireInstallPrompt("dismissed");
    await act(async () => {
      await result.current.promptInstall();
    });
    expect(store().installed).toBe(false);
    expect(store().dismissCount).toBe(1);
    expect(result.current.mode).toBeNull();
  });

  it("the appinstalled event stops the nudge", async () => {
    setup({ ua: ANDROID });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    fireInstallPrompt();
    expect(result.current.mode).toBe("prompt");
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.mode).toBeNull();
    expect(store().installed).toBe(true);
  });

  it("running as the installed app records the install and never nudges", async () => {
    setup({ ua: ANDROID, standalone: true });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    fireInstallPrompt();
    expect(result.current.mode).toBeNull();
    expect(store().installed).toBe(true);
  });

  it("a fresh install prompt clears a stale installed flag (app was uninstalled)", async () => {
    setup({ ua: ANDROID, stored: { installed: true } });
    const usePwaInstall = await loadHook();
    const { result } = renderHook(() => usePwaInstall());
    fireInstallPrompt();
    expect(store().installed).toBe(false);
    expect(result.current.mode).toBe("prompt");
  });

  it("iOS Safari gets the manual steps; its in-app browsers do not", async () => {
    setup({ ua: IPHONE });
    let usePwaInstall = await loadHook();
    const safari = renderHook(() => usePwaInstall());
    expect(safari.result.current.mode).toBe("ios");
    safari.unmount();

    vi.resetModules();
    setup({ ua: IPHONE + " Instagram 300.0" });
    usePwaInstall = await loadHook();
    const inApp = renderHook(() => usePwaInstall());
    expect(inApp.result.current.mode).toBeNull();
  });
});

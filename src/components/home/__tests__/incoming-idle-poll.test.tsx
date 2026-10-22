// @vitest-environment jsdom
/**
 * Idle poll cadence of the Repair Pro incoming-request popup follows realtime
 * health: 10s while the shared channel is `connected` and online, 3s otherwise.
 * A card on screen keeps the fast cadence (covered in incoming-job-popup-close).
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IncomingJobPopup } from "@/components/home/incoming-job-popup";
import type { JobRecord } from "@/lib/jobs/types";

const client = vi.hoisted(() => ({
  apiListJobs: vi.fn(),
  apiProIncomingStatus: vi.fn(),
  apiGetJob: vi.fn(),
  apiTransition: vi.fn(),
  apiDeferJob: vi.fn(),
  apiSurfaceJob: vi.fn(() => Promise.resolve({ ok: true })),
  apiGetCallout: vi.fn(() => Promise.resolve({ ok: true, data: { quote: null } })),
}));
const diag = vi.hoisted(() => ({ record: vi.fn() }));

type StatusFn = (
  state: string,
  meta: { reconnected: boolean; hadPriorConnection: boolean },
) => void;
const realtime = vi.hoisted(() => {
  const h: {
    onChange: ((p: unknown) => void) | null;
    onStatus: StatusFn | null;
  } = { onChange: null, onStatus: null };
  return h;
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/jobs",
}));
vi.mock("@/lib/store", () => ({
  useApp: () => ({
    accountType: "professional",
    backendUserId: "p1",
    theme: "light",
    isAuthenticated: true,
    authReady: true,
  }),
}));
vi.mock("@/lib/supabase/app-api", () => ({
  backendSubscribeJobs: (
    _userId: string,
    onChange: (p: unknown) => void,
    _source: string,
    onStatus?: StatusFn,
  ) => {
    realtime.onChange = onChange;
    realtime.onStatus = onStatus ?? null;
    return () => {
      realtime.onChange = null;
      realtime.onStatus = null;
    };
  },
}));
vi.mock("@/lib/jobs/client", () => client);
vi.mock("@/lib/jobs/diagnostics/collector", () => ({
  recordJobDiagnostic: (...args: unknown[]) => diag.record(...args),
}));
vi.mock("@/lib/jobs/server-clock", () => ({
  refreshServerClock: vi.fn(async () => {}),
  serverNow: () => Date.now(),
  syncServerClock: vi.fn(),
}));
vi.mock("@/lib/app-notify", () => ({
  canNotify: () => false,
  ensureNotifyPermission: async () => "denied",
  showAppNotification: vi.fn(),
  vibrateCallPattern: vi.fn(),
}));
vi.mock("@/lib/sound-tone", () => ({ playAppSound: vi.fn(), unlockAudio: vi.fn() }));
vi.mock("@/components/jobs/voice-note-player", () => ({ VoiceNotePlayer: () => null }));

const NOW = Date.parse("2026-08-12T10:00:00.000Z");
const openJob = {
  id: "j1",
  motoristId: "m1",
  motoristName: "Mina",
  motoristVehicle: "Toyota Camry",
  repairProId: "p1",
  repairProName: "Pro",
  serviceType: "mechanic",
  problem: "Engine won't start",
  status: "reserved",
  pairingStage: "reserved",
  pairingDeadline: new Date(NOW + 120_000).toISOString(),
  negotiateEndsAt: new Date(NOW + 150_000).toISOString(),
  photos: [],
  currency: "USD",
  proBaseMajor: 0,
  agreedMajor: null,
  offers: [],
  maxOffers: 6,
  locationLabel: "Here",
  motoristLocation: { lat: 1, lng: 2 },
  statusHistory: [],
} as unknown as JobRecord;

const okList = (jobs: JobRecord[]) => ({ ok: true, data: { jobs } });
const noMeta = { reconnected: false, hadPriorConnection: false };

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
};
const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
};
const setStatus = async (state: string, meta = noMeta) => {
  await act(async () => {
    realtime.onStatus?.(state, meta);
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
};
const listCalls = () => client.apiListJobs.mock.calls.length;
const missedPushCount = () =>
  diag.record.mock.calls.filter((c) => c[3] === "missed-push").length;

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  client.apiListJobs.mockResolvedValue(okList([]));
  client.apiProIncomingStatus.mockResolvedValue({ ok: true, data: { jobs: [] } });
  client.apiGetJob.mockResolvedValue(okList([openJob]));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("incoming popup idle poll cadence", () => {
  it("polls every 3s while realtime is not confirmed (I2)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    const base = listCalls();
    await advance(3_000);
    await advance(3_000);
    expect(listCalls()).toBe(base + 2);
  });

  it("slows to 10s once the channel is connected (I1)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    const base = listCalls();
    await advance(9_900);
    expect(listCalls()).toBe(base);
    await advance(100);
    expect(listCalls()).toBe(base + 1);
  });

  it("returns to 3s when the channel drops and polls at once on reconnect (I2, I4)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    await setStatus("reconnecting", { reconnected: false, hadPriorConnection: true });
    let base = listCalls();
    await advance(3_000);
    expect(listCalls()).toBe(base + 1);

    base = listCalls();
    await setStatus("connected", { reconnected: true, hadPriorConnection: true });
    expect(listCalls()).toBe(base + 1);
  });

  it("returns to 3s offline and polls when back online (I2, I4)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });
    let base = listCalls();
    await advance(3_000);
    expect(listCalls()).toBe(base + 1);

    base = listCalls();
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });
    expect(listCalls()).toBe(base + 1);
  });

  it("a realtime push still polls immediately while connected (I4)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    const base = listCalls();
    await act(async () => {
      realtime.onChange?.({ new: { id: "jx", status: "requested" } });
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });
    expect(listCalls()).toBeGreaterThan(base);
  });

  it("records missed-push when an interval poll first sees an offer while connected (I5)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    client.apiListJobs.mockResolvedValue(okList([openJob]));
    await advance(10_000);
    expect(missedPushCount()).toBe(1);
  });

  it("does not record missed-push when the offer arrives via a realtime push (I5)", async () => {
    render(<IncomingJobPopup />);
    await flush();
    await setStatus("connected");
    client.apiListJobs.mockResolvedValue(okList([openJob]));
    await act(async () => {
      realtime.onChange?.({ new: { id: "j1", repair_pro_id: "p1", status: "reserved" } });
      for (let i = 0; i < 8; i++) await Promise.resolve();
    });
    expect(missedPushCount()).toBe(0);
  });
});

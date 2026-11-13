// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceRequest, Technician, UserProfile } from "@/lib/types";

const m = vi.hoisted(() => ({
  create: vi.fn(),
  online: true,
  verifyOn: false,
}));

vi.mock("@/lib/supabase/app-api", () => ({
  backendCreateJob: (...a: unknown[]) => m.create(...a),
  isAppBackendOnline: () => m.online,
}));
vi.mock("@/lib/app-config", () => ({
  getRuntimeAppConfig: () => ({
    features: { identityVerifyEnabled: m.verifyOn },
    verification: { trialDays: 30, warnFrom: 3, blockAt: 5 },
  }),
}));

import { REQUEST_FAILED_MESSAGE, useRequests } from "../use-requests";

const TECH = { id: "pro-1", name: "Ada Autos", serviceType: "mechanic", etaMinutes: 12, distanceKm: 3, photo: "p.png" } as unknown as Technician;
const PRICING = { labourBaseMajor: 5000, labourAgreedMajor: 5000, discountPercent: 0, pricingCurrency: "NGN" as const };
const LOCATION = { label: "12 Allen Avenue", city: "Ikeja", coordinates: { lat: 6.6, lng: 3.35 } };

const profile = (over: Partial<UserProfile> = {}) =>
  ({ fullName: "Chi", serviceActionCount: 0, ...over }) as unknown as UserProfile;
const cloudRequest = (id = "job-1"): ServiceRequest =>
  ({ id, technicianId: "pro-1", technicianName: "Ada Autos", serviceType: "mechanic", problem: "Flat tyre", status: "pending", createdAt: "2026-11-13T10:00:00Z", locationLabel: "Near you", etaMinutes: 9, distanceKm: 2 }) as unknown as ServiceRequest;

type Props = { backendUserId: string | null; accountType: "motorist" | "professional" | null; userProfile: UserProfile | null };
const persist = vi.fn();

function mount(initial: Partial<Props> = {}) {
  return renderHook(
    (props: Props) => {
      const [requests, setRequests] = useState<ServiceRequest[]>([]);
      const api = useRequests(
        { displayName: "Chi", accountType: props.accountType, userProfile: props.userProfile, helpingSomeoneElse: false, backendUserId: props.backendUserId } as never,
        { location: LOCATION, radiusKm: 10, setRequests } as never,
        { persistProfile: persist } as never,
      );
      return { requests, ...api };
    },
    { initialProps: { backendUserId: "u1", accountType: "motorist", userProfile: profile(), ...initial } as Props },
  );
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  vi.clearAllMocks();
  m.online = true;
  m.verifyOn = false;
});
afterEach(() => cleanup());

describe("createRequest: the optimistic request and what the server says", () => {
  it("shows the request at once, then swaps it for the server's real one on success (unchanged behaviour)", async () => {
    const d = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValue(d.promise);
    const { result } = mount();
    let local!: ServiceRequest;
    act(() => { local = result.current.createRequest(TECH, "Flat tyre", PRICING); });
    expect(local.id).toMatch(/^r-\d+$/);
    expect(local.status).toBe("pending");
    expect(result.current.requests.map((r) => r.id)).toEqual([local.id]);

    await act(async () => { d.resolve({ error: null, request: cloudRequest("job-1") }); });
    expect(result.current.requests.map((r) => r.id)).toEqual(["job-1"]);
    expect(result.current.requests[0].locationLabel).toBe("12 Allen Avenue, Ikeja");
    expect(result.current.requests[0].labourBaseMajor).toBe(5000);
  });

  it("a refused request is taken back out of the list and the caller is told why (was: stayed 'pending' forever)", async () => {
    m.create.mockResolvedValue({ error: "Pro is not available right now" });
    const onFailure = vi.fn();
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "Flat tyre", PRICING, { onFailure }); });
    await flush();
    expect(result.current.requests).toEqual([]);
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith("Pro is not available right now");
  });

  it("uses a default message when the server gives no reason", async () => {
    m.create.mockResolvedValue({ error: null });
    const onFailure = vi.fn();
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "x", PRICING, { onFailure }); });
    await flush();
    expect(result.current.requests).toEqual([]);
    expect(onFailure).toHaveBeenCalledWith(REQUEST_FAILED_MESSAGE);
  });

  it("an unexpected rejection is handled the same way (no unhandled rejection, no ghost)", async () => {
    m.create.mockRejectedValue(new Error("socket hang up"));
    const onFailure = vi.fn();
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "x", PRICING, { onFailure }); });
    await flush();
    expect(result.current.requests).toEqual([]);
    expect(onFailure).toHaveBeenCalledWith("socket hang up");
  });

  it("only the failed request is removed; others in the list are untouched", async () => {
    const first = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ error: "nope" });
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "first", PRICING); });
    // Make the second id different even within the same millisecond.
    await act(async () => { await new Promise((r) => setTimeout(r, 3)); });
    act(() => { result.current.createRequest(TECH, "second", PRICING); });
    await flush();
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].problem).toContain("first");
    await act(async () => { first.resolve({ error: null, request: cloudRequest("job-9") }); });
    expect(result.current.requests.map((r) => r.id)).toEqual(["job-9"]);
  });

  it("works without any failure handler (callers that pass none still get the rollback)", async () => {
    m.create.mockResolvedValue({ error: "nope" });
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "x", PRICING); });
    await flush();
    expect(result.current.requests).toEqual([]);
  });
});

describe("createRequest: situations that must not change", () => {
  it("offline / demo mode keeps the local request and never calls the server", async () => {
    m.online = false;
    const onFailure = vi.fn();
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "x", PRICING, { onFailure }); });
    await flush();
    expect(m.create).not.toHaveBeenCalled();
    expect(result.current.requests).toHaveLength(1);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("a Repair Pro account never creates a job through this path", async () => {
    const { result } = mount({ accountType: "professional" });
    act(() => { result.current.createRequest(TECH, "x", PRICING); });
    await flush();
    expect(m.create).not.toHaveBeenCalled();
    expect(result.current.requests).toHaveLength(1);
  });

  it("sends the same job to the server as before", async () => {
    m.create.mockResolvedValue({ error: null, request: cloudRequest() });
    const { result } = mount();
    act(() => { result.current.createRequest(TECH, "Flat tyre", PRICING); });
    await flush();
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({
      motoristId: "u1", repairProId: "pro-1", serviceType: "mechanic", description: "Flat tyre",
      address: "12 Allen Avenue, Ikeja", radiusKm: 10, proBaseMajor: 5000, currency: "NGN", lat: 6.6, lng: 3.35,
    }));
  });
});

describe("account switch while a booking is in flight", () => {
  it("a late success is not added to the other account's list", async () => {
    const d = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValue(d.promise);
    const { result, rerender } = mount();
    act(() => { result.current.createRequest(TECH, "x", PRICING); });
    rerender({ backendUserId: "u2", accountType: "motorist", userProfile: profile() });
    await act(async () => { d.resolve({ error: null, request: cloudRequest("job-1") }); });
    expect(result.current.requests.map((r) => r.id)).not.toContain("job-1");
  });

  it("a late failure does not show a message to (or refund) the other account", async () => {
    const d = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValue(d.promise);
    const onFailure = vi.fn();
    const { result, rerender } = mount();
    act(() => { result.current.bookRequest(TECH, "x", PRICING, { onFailure }); });
    persist.mockClear();
    rerender({ backendUserId: "u2", accountType: "motorist", userProfile: profile({ serviceActionCount: 7 }) });
    await act(async () => { d.resolve({ error: "nope" }); });
    expect(onFailure).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });
});

describe("bookRequest and the free-trial count", () => {
  it("counts the booking at once and starts the free window (unchanged)", () => {
    m.create.mockReturnValue(new Promise(() => {}));
    const { result } = mount({ userProfile: profile({ serviceActionCount: 2 }) });
    let res!: ReturnType<typeof result.current.bookRequest>;
    act(() => { res = result.current.bookRequest(TECH, "x", PRICING); });
    expect(res).toMatchObject({ ok: true, actionCount: 3 });
    expect(persist).toHaveBeenCalledWith(expect.objectContaining({ serviceActionCount: 3, firstServiceAt: expect.any(String) }));
  });

  it("a FAILED booking gives the count back, and un-starts the free window if this booking started it", async () => {
    m.create.mockResolvedValue({ error: "nope" });
    const onFailure = vi.fn();
    const { result } = mount({ userProfile: profile({ serviceActionCount: 0 }) });
    act(() => { result.current.bookRequest(TECH, "x", PRICING, { onFailure }); });
    await flush();
    const last = persist.mock.calls[persist.mock.calls.length - 1][0] as UserProfile;
    expect(last.serviceActionCount).toBe(0);
    expect(last.firstServiceAt).toBeUndefined();
    expect(onFailure).toHaveBeenCalledWith("nope");
    expect(result.current.requests).toEqual([]);
  });

  it("a failed FIRST booking removes the free-window start that this booking itself set", async () => {
    const d = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValue(d.promise);
    const { result, rerender } = mount({ userProfile: profile({ serviceActionCount: 0 }) });
    act(() => { result.current.bookRequest(TECH, "x", PRICING); });
    // The app re-renders with what the booking persisted: count 1 and a firstServiceAt stamp.
    const stamped = (persist.mock.calls[0][0] as UserProfile);
    expect(stamped.firstServiceAt).toEqual(expect.any(String));
    rerender({ backendUserId: "u1", accountType: "motorist", userProfile: stamped });
    await act(async () => { d.resolve({ error: "nope" }); });
    const last = persist.mock.calls[persist.mock.calls.length - 1][0] as UserProfile;
    expect(last.serviceActionCount).toBe(0);
    expect(last.firstServiceAt).toBeUndefined();
  });

  it("a failed booking keeps an existing free window and other bookings' counts", async () => {
    const d = deferred<{ error: string | null; request?: ServiceRequest }>();
    m.create.mockReturnValue(d.promise);
    const { result, rerender } = mount({ userProfile: profile({ serviceActionCount: 4, firstServiceAt: "2026-10-01T00:00:00Z" }) });
    act(() => { result.current.bookRequest(TECH, "x", PRICING); });
    // The app re-renders with the incremented profile, and a SECOND booking has been counted meanwhile.
    rerender({ backendUserId: "u1", accountType: "motorist", userProfile: profile({ serviceActionCount: 6, firstServiceAt: "2026-10-01T00:00:00Z" }) });
    await act(async () => { d.resolve({ error: "nope" }); });
    const last = persist.mock.calls[persist.mock.calls.length - 1][0] as UserProfile;
    expect(last.serviceActionCount).toBe(5);
    expect(last.firstServiceAt).toBe("2026-10-01T00:00:00Z");
  });

  it("refunds correctly even if the failure arrives before React re-renders with the increment", async () => {
    m.create.mockResolvedValue({ error: "nope" });
    const { result } = mount({ userProfile: profile({ serviceActionCount: 3, firstServiceAt: "2026-10-01T00:00:00Z" }) });
    act(() => { result.current.bookRequest(TECH, "x", PRICING); });
    await flush(); // profile prop was never updated: the ref still holds the pre-booking profile
    const last = persist.mock.calls[persist.mock.calls.length - 1][0] as UserProfile;
    expect(last.serviceActionCount).toBe(3);
  });

  it("a successful booking keeps its count", async () => {
    m.create.mockResolvedValue({ error: null, request: cloudRequest() });
    const { result } = mount({ userProfile: profile({ serviceActionCount: 1 }) });
    act(() => { result.current.bookRequest(TECH, "x", PRICING); });
    await flush();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(result.current.requests.map((r) => r.id)).toEqual(["job-1"]);
  });

  it("the existing gates still stop a booking before anything is created", () => {
    const { result } = mount();
    let res!: ReturnType<typeof result.current.bookRequest>;
    act(() => { res = result.current.bookRequest(TECH, "x", { ...PRICING, labourBaseMajor: 0 }); });
    expect(res).toMatchObject({ ok: false, code: "invalid" });
    expect(m.create).not.toHaveBeenCalled();
    expect(result.current.requests).toEqual([]);
    expect(persist).not.toHaveBeenCalled();
  });
});

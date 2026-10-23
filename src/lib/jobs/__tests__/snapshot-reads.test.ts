import { describe, expect, it, vi } from "vitest";
import type { CalloutQuote } from "@/lib/callout/constants";
import type { JobRecord } from "@/lib/jobs/types";
import {
  createSnapshotReads,
  mergeJobRelatedFields,
  pickMoreAuthoritativeCalloutQuote,
  reconcileJobSnapshot,
  snapshotCanReplace,
} from "../snapshot-reads";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

describe("snapshot lanes", () => {
  it("shares only equivalent in-flight work and releases settled entries", async () => {
    const lanes = createSnapshotReads();
    const first = deferred<number>();
    const read = vi.fn(() => first.promise);
    const a = lanes.read("job:a", read);
    expect(lanes.read("job:a", read)).toBe(a);
    expect(await lanes.read("requests", async () => 7)).toBe(7);
    first.resolve(1); expect(await a).toBe(1);
    expect(await lanes.read("job:a", async () => 2)).toBe(2);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("coalesces invalidations into one follow-up and retains changes during that read", async () => {
    const lanes = createSnapshotReads();
    const first = deferred<number>(); const second = deferred<number>();
    const read = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockResolvedValue(3);
    const a = lanes.read("job", read);
    const b = lanes.read("job", read, true);
    expect(lanes.read("job", read, true)).toBe(b);
    expect(lanes.read("job", read)).toBe(a);
    first.resolve(1); await a;
    const c = lanes.read("job", read, true);
    expect(c).not.toBe(b);
    second.resolve(2); expect(await b).toBe(2); expect(await c).toBe(3);
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("starts queued recovery after failure and permits future retries", async () => {
    const lanes = createSnapshotReads(); const first = deferred<number>();
    const a = lanes.read("job", () => first.promise);
    const error = expect(a).rejects.toThrow("offline");
    const b = lanes.read("job", async () => 2, true);
    first.reject(new Error("offline")); await error;
    expect(await b).toBe(2);
    expect(await lanes.read("job", async () => 3)).toBe(3);
  });

  it("does not start queued work after its last owner disposes", async () => {
    const lanes = createSnapshotReads(); const first = deferred<number>();
    const a = lanes.read("job", () => first.promise);
    await Promise.resolve();
    const follow = vi.fn(async () => 2);
    const b = lanes.read("job", follow, true);
    const error = expect(b).rejects.toThrow("scope ended");
    lanes.dispose(); first.resolve(1); await a; await error;
    expect(follow).not.toHaveBeenCalled();
    await expect(lanes.read("job", follow)).rejects.toThrow("scope ended");
  });
});

describe("snapshot revision guards", () => {
  it("rejects lower/missing revisions regardless of timestamps and accepts higher revisions", () => {
    const current = { id: "j", jobVersion: 8 };
    expect(snapshotCanReplace({ id: "j", jobVersion: 7 }, current, current)).toBe(false);
    expect(snapshotCanReplace({ id: "j" }, current, current)).toBe(false);
    expect(snapshotCanReplace({ id: "j", jobVersion: 9 }, current, null)).toBe(true);
  });
  it("does not overwrite intervening equal-version or unversioned mutation results", () => {
    const current = { id: "j", jobVersion: 8 };
    expect(snapshotCanReplace({ ...current }, current, { ...current })).toBe(false);
    expect(snapshotCanReplace({ ...current }, current, current)).toBe(true);
    expect(snapshotCanReplace({ id: "j" }, { id: "j" }, null)).toBe(false);
  });

  it("orders call-out quotes monotonically and rejects cross-job or cross-pro quote leaks", () => {
    const baseJob = {
      id: "job-1",
      jobVersion: 3,
      serviceType: "mechanic",
      motoristId: "m1",
      repairProId: "p1",
    } as JobRecord;
    const pendingQuote = {
      requestId: "job-1",
      calloutStatus: "PENDING",
      tradeId: "mechanic",
      originProId: "p1",
      calculatedAt: "2026-10-20T10:00:00Z",
    } as CalloutQuote;
    const calculatedQuote = {
      ...pendingQuote,
      calloutStatus: "CALCULATED",
      calloutFee: 4500,
      calculatedAt: "2026-10-20T10:01:00Z",
    } as CalloutQuote;
    const lockedQuote = {
      ...calculatedQuote,
      calloutStatus: "LOCKED",
      lockedAt: "2026-10-20T10:02:00Z",
    } as CalloutQuote;
    const wrongProQuote = {
      ...lockedQuote,
      originProId: "p2",
    } as CalloutQuote;

    // A null or PENDING quote never overwrites a CALCULATED or LOCKED quote
    expect(pickMoreAuthoritativeCalloutQuote(null, calculatedQuote, baseJob)).toBe(calculatedQuote);
    expect(pickMoreAuthoritativeCalloutQuote(pendingQuote, calculatedQuote, baseJob)).toBe(calculatedQuote);
    expect(pickMoreAuthoritativeCalloutQuote(lockedQuote, calculatedQuote, baseJob)).toBe(lockedQuote);

    // A quote from a previous pro is rejected when repairProId changed
    expect(pickMoreAuthoritativeCalloutQuote(null, wrongProQuote, baseJob)).toBeNull();
  });

  it("preserves hydrated contact/vehicle fields across unhydrated updates and clears pro fields on pro reassignment", () => {
    const hydrated = {
      id: "job-1",
      jobVersion: 4,
      status: "agreed",
      serviceType: "mechanic",
      motoristId: "m1",
      motoristName: "Ada Lovelace",
      motoristPhone: "+2348011111111",
      motoristPhoto: "https://example.com/ada.jpg",
      motoristVehicle: "Toyota Camry 2019",
      repairProId: "p1",
      repairProName: "Kunle Auto",
      repairProPhone: "+2348022222222",
      repairProPhoto: "https://example.com/kunle.jpg",
      calloutQuote: {
        requestId: "job-1",
        calloutStatus: "CALCULATED",
        tradeId: "mechanic",
        originProId: "p1",
        calloutFee: 4500,
      } as CalloutQuote,
    } as JobRecord;

    const unhydratedMutation = {
      id: "job-1",
      jobVersion: 5,
      status: "paid_booked",
      serviceType: "mechanic",
      motoristId: "m1",
      motoristName: "Customer",
      motoristPhone: null,
      motoristPhoto: null,
      motoristVehicle: null,
      repairProId: "p1",
      repairProName: "Repair Pro",
      repairProPhone: null,
      repairProPhoto: undefined,
      calloutQuote: null,
    } as JobRecord;

    const merged = mergeJobRelatedFields(unhydratedMutation, hydrated);
    expect(merged.status).toBe("paid_booked");
    expect(merged.jobVersion).toBe(5);
    expect(merged.motoristName).toBe("Ada Lovelace");
    expect(merged.motoristPhone).toBe("+2348011111111");
    expect(merged.motoristPhoto).toBe("https://example.com/ada.jpg");
    expect(merged.motoristVehicle).toBe("Toyota Camry 2019");
    expect(merged.repairProName).toBe("Kunle Auto");
    expect(merged.repairProPhone).toBe("+2348022222222");
    expect(merged.repairProPhoto).toBe("https://example.com/kunle.jpg");
    expect(merged.calloutQuote?.calloutStatus).toBe("CALCULATED");

    // Reassigned to a different pro: motorist fields stay, old pro fields & quote do NOT leak
    const reassigned = {
      ...unhydratedMutation,
      jobVersion: 6,
      status: "waiting_for_pro",
      repairProId: "p2",
      repairProName: "Repair Pro",
      repairProPhone: null,
      repairProPhoto: undefined,
    } as JobRecord;
    const afterReassign = mergeJobRelatedFields(reassigned, merged);
    expect(afterReassign.motoristPhone).toBe("+2348011111111");
    expect(afterReassign.repairProId).toBe("p2");
    expect(afterReassign.repairProName).toBe("Repair Pro");
    expect(afterReassign.repairProPhone).toBeNull();
    expect(afterReassign.repairProPhoto).toBeUndefined();
    expect(afterReassign.calloutQuote).toBeNull();
  });

  it("enriches current state with newly hydrated fields when an equal-version commit intervened mid-flight", () => {
    const started = {
      id: "job-1",
      jobVersion: 4,
      status: "negotiating",
      serviceType: "mechanic",
      motoristId: "m1",
      motoristName: "Customer",
      repairProId: "p1",
      repairProName: "Repair Pro",
    } as JobRecord;
    // Optimistic or intervening commit at version 4
    const current = {
      ...started,
      status: "agreed",
      agreedMajor: 15000,
    } as JobRecord;
    // In-flight GET started before commit, returns version 4 with hydrated contacts + quote
    const incomingRead = {
      ...started,
      motoristName: "Ada Lovelace",
      motoristPhone: "+2348011111111",
      repairProName: "Kunle Auto",
      repairProPhone: "+2348022222222",
      calloutQuote: {
        requestId: "job-1",
        calloutStatus: "CALCULATED",
        tradeId: "mechanic",
        originProId: "p1",
        calloutFee: 4200,
      } as CalloutQuote,
    } as JobRecord;

    const reconciled = reconcileJobSnapshot(incomingRead, current, started);
    expect(reconciled).not.toBeNull();
    // Preserves current's core status/agreedMajor while enriching hydrated fields
    expect(reconciled?.status).toBe("agreed");
    expect(reconciled?.agreedMajor).toBe(15000);
    expect(reconciled?.motoristName).toBe("Ada Lovelace");
    expect(reconciled?.repairProPhone).toBe("+2348022222222");
    expect(reconciled?.calloutQuote?.calloutFee).toBe(4200);
  });
});

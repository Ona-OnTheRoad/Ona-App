import { describe, expect, it } from "vitest";
import { isJobParty } from "../auth-utils";
import type { JobFlowStatus } from "@/lib/jobs/types";

/** Every status a job can be in, so a new status cannot silently open access. */
const ALL_STATUSES: JobFlowStatus[] = [
  "scheduled", "waiting_for_selected", "selected_review", "sequential_pairing", "waiting_for_pro",
  "reserved", "negotiating", "searching", "agreed", "paid_booked", "en_route", "arrived",
  "in_progress", "completed", "satisfied", "released", "cancelled", "expired", "disputed",
  "under_appeal", "refunded",
];

const job = (status: JobFlowStatus, over: Record<string, unknown> = {}) =>
  ({ motoristId: "customer-1", repairProId: "pro-1", chosenProId: null, status, ...over });

describe("isJobParty: only the people on a job may read or act on it", () => {
  it.each(ALL_STATUSES)("%s: the customer and the assigned Pro are parties", (status) => {
    expect(isJobParty("customer-1", job(status))).toBe(true);
    expect(isJobParty("pro-1", job(status))).toBe(true);
  });

  it.each(ALL_STATUSES)("%s: an uninvolved Service Pro is NOT a party", (status) => {
    expect(isJobParty("pro-2", job(status))).toBe(false);
  });

  it.each(ALL_STATUSES)("%s: another customer is NOT a party", (status) => {
    expect(isJobParty("customer-2", job(status))).toBe(false);
  });

  it("negotiating and searching are not special: that is where outsiders could read and forge offers", () => {
    expect(isJobParty("stranger", job("negotiating"))).toBe(false);
    expect(isJobParty("stranger", job("searching"))).toBe(false);
  });

  it("a Pro who was offered the job earlier but is no longer assigned (declined, timed out, re-routed) is NOT a party", () => {
    // chosenProId stays on the record after a re-route; it must never keep access alive.
    expect(isJobParty("pro-1", job("sequential_pairing", { repairProId: "pro-2", chosenProId: "pro-1" }))).toBe(false);
    expect(isJobParty("pro-2", job("sequential_pairing", { repairProId: "pro-2", chosenProId: "pro-1" }))).toBe(true);
  });

  it("an unassigned job (empty or missing Pro id) is not open to anyone with an empty or missing id", () => {
    expect(isJobParty("", job("sequential_pairing", { repairProId: "", chosenProId: "" }))).toBe(false);
    expect(isJobParty("", job("negotiating", { motoristId: undefined, repairProId: undefined }))).toBe(false);
    expect(isJobParty("pro-2", job("sequential_pairing", { repairProId: "" }))).toBe(false);
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { JobRecord } from "@/lib/jobs/types";
const client = vi.hoisted(() => ({ apiPlaceOffer: vi.fn(), apiAcceptOffer: vi.fn() }));
vi.mock("@/lib/jobs/client", () => client);
import { NegotiationFooter } from "../negotiation-footer";
const confirmed = { id: "job", status: "negotiating", pairingStage: null, negotiateEndsAt: new Date(Date.now() + 1_200_000).toISOString(), currency: "NGN", offers: [] } as unknown as JobRecord;
function draw(job: JobRecord) {
  return render(<NegotiationFooter job={job} viewer="repair_pro" actorId="pro" busy={false} offerInput="5000" setOfferInput={vi.fn()} setErr={vi.fn()} setConfirmCancel={vi.fn()} run={async (fn) => { await fn(); }} last={undefined} mySide="repair_pro" canOffer canAccept={false} />);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it.each([
  { ...confirmed, status: "reserved", pairingStage: "reserved" },
  { ...confirmed, pairingStage: "reserved" },
  { ...confirmed, negotiateEndsAt: new Date(Date.now() + 365 * 86400_000).toISOString() },
  { ...confirmed, negotiateEndsAt: new Date(Date.now() - 1000).toISOString() },
])("does not offer a send action before real negotiation readiness", (job) => {
  draw(job as JobRecord);
  expect(screen.queryByRole("textbox", { name: "Labour price offer" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Send/ })).toBeNull();
  expect(screen.getByRole("status")).toBeTruthy();
});
it("enables submitting the first labour price after confirmed negotiation", () => {
  client.apiPlaceOffer.mockResolvedValue({ ok: true, data: { job: confirmed } });
  draw(confirmed);
  fireEvent.click(screen.getByRole("button", { name: /Send/ }));
  expect(client.apiPlaceOffer).toHaveBeenCalledWith({ jobId: "job", side: "repair_pro", actorId: "pro", amountMajor: 5000 });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  user: "outsider",
  getJob: vi.fn(), placeOffer: vi.fn(), acceptOffer: vi.fn(), quote: vi.fn(),
}));

// Keep the REAL isJobParty: this is a test of the access rule, not of a mock of it.
vi.mock("@/lib/server/auth-utils", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/auth-utils")>()),
  requireUser: async () => ({ ok: true, userId: m.user }),
}));
vi.mock("@/lib/server/jobs/job-store", () => ({
  getJob: m.getJob, placeOffer: m.placeOffer, acceptOffer: m.acceptOffer,
}));
vi.mock("@/lib/server/callout/resolve", () => ({ resolveJobCalloutQuote: m.quote }));
vi.mock("@/lib/server/structured-logger", () => ({ serverLogger: { warn: vi.fn(), error: vi.fn() } }));

import { GET } from "../route";
import { POST as offer } from "../offer/route";

const ctx = { params: Promise.resolve({ id: "job-1" }) };
const negotiating = {
  id: "job-1", motoristId: "customer-1", repairProId: "pro-1", status: "negotiating",
  motoristLocation: { lat: 6.5, lng: 3.3 }, motoristName: "Ada", problem: "Engine knocking",
};
const post = (body: unknown) =>
  offer(new Request("http://localhost/api/jobs/job-1/offer", { method: "POST", body: JSON.stringify(body) }), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  m.user = "outsider";
  m.getJob.mockResolvedValue({ ...negotiating });
  m.quote.mockResolvedValue(null);
  m.placeOffer.mockResolvedValue({ job: negotiating });
  m.acceptOffer.mockResolvedValue({ job: negotiating });
});

describe.each(["negotiating", "searching"])("a job that is %s", (status) => {
  beforeEach(() => m.getJob.mockResolvedValue({ ...negotiating, status }));

  it("cannot be READ by someone who is not on it (location, vehicle and problem stay private)", async () => {
    const res = await GET(new Request("http://localhost/api/jobs/job-1"), ctx);
    expect(res.status).toBe(403);
    expect(JSON.stringify(await res.json())).not.toContain("Engine knocking");
  });

  it("cannot receive an offer posing as the Pro from an outsider", async () => {
    const res = await post({ action: "place", side: "repair_pro", actorId: "outsider", amountMajor: 4000 });
    expect(res.status).toBe(403);
    expect(m.placeOffer).not.toHaveBeenCalled();
  });

  it("cannot have the customer's offer accepted by an outsider", async () => {
    const res = await post({ action: "accept", side: "repair_pro", actorId: "outsider" });
    expect(res.status).toBe(403);
    expect(m.acceptOffer).not.toHaveBeenCalled();
  });

  it("cannot be offered on by a different CUSTOMER posing as the Pro", async () => {
    m.user = "customer-2";
    const res = await post({ action: "place", side: "repair_pro", actorId: "customer-2", amountMajor: 4000 });
    expect(res.status).toBe(403);
    expect(m.placeOffer).not.toHaveBeenCalled();
  });
});

describe("the real parties are unaffected", () => {
  it("the customer reads their job and places an offer", async () => {
    m.user = "customer-1";
    expect((await GET(new Request("http://localhost/api/jobs/job-1"), ctx)).status).toBe(200);
    const res = await post({ action: "place", side: "motorist", actorId: "customer-1", amountMajor: 6000 });
    expect(res.status).toBe(200);
    expect(m.placeOffer).toHaveBeenCalledWith(expect.objectContaining({ side: "motorist", actorId: "customer-1" }));
  });

  it("the assigned Pro reads the job, places an offer and accepts", async () => {
    m.user = "pro-1";
    expect((await GET(new Request("http://localhost/api/jobs/job-1"), ctx)).status).toBe(200);
    expect((await post({ action: "place", side: "repair_pro", actorId: "pro-1", amountMajor: 8000 })).status).toBe(200);
    expect((await post({ action: "accept", side: "repair_pro", actorId: "pro-1" })).status).toBe(200);
    expect(m.acceptOffer).toHaveBeenCalledWith(expect.objectContaining({ by: "repair_pro", actorId: "pro-1" }));
  });

  it("a party still cannot claim the other side", async () => {
    m.user = "customer-1";
    const res = await post({ action: "place", side: "repair_pro", actorId: "customer-1", amountMajor: 1000 });
    expect(res.status).toBe(403);
    expect(m.placeOffer).not.toHaveBeenCalled();
  });
});

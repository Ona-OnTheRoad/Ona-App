import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "../route";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), job: vi.fn(), party: vi.fn(), quote: vi.fn() }));
vi.mock("@/lib/server/auth-utils", () => ({ requireUser: mocks.auth, isJobParty: mocks.party }));
vi.mock("@/lib/server/jobs/job-store", () => ({ getJob: mocks.job }));
vi.mock("@/lib/server/callout/resolve", () => ({ resolveJobCalloutQuote: mocks.quote }));
const id = "11111111-1111-4111-8111-111111111111";
const request = (jobId = id) => GET(new Request(`http://localhost/api/jobs/${jobId}/callout`),
  { params: Promise.resolve({ id: jobId }) });
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ ok: true, userId: "customer" });
  mocks.job.mockResolvedValue({ id, proBaseMajor: 3000, agreedMajor: 2500, currency: "NGN" });
  mocks.party.mockReturnValue(true); mocks.quote.mockResolvedValue({ calloutStatus: "LOCKED", calloutFee: 3500 });
});
it.each(["new", "pending-dccswh6f", "not-a-uuid", "11111111-1111-4111-8111-11111111111Z"])(
  "returns 400 before storage for invalid ID %s", async (jobId) => {
    const res = await request(jobId); expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_job_id");
    expect(mocks.job).not.toHaveBeenCalled(); expect(mocks.quote).not.toHaveBeenCalled();
  },
);
it("keeps authentication before ID validation and storage", async () => {
  mocks.auth.mockResolvedValue({ ok: false, response: new Response(null, { status: 401 }) });
  expect((await request("pending-draft")).status).toBe(401); expect(mocks.job).not.toHaveBeenCalled();
});
it("loads a valid persisted job and preserves the quote/labour response", async () => {
  const res = await request(); expect(res.status).toBe(200);
  expect(mocks.job).toHaveBeenCalledExactlyOnceWith(id);
  expect((await res.json()).data).toEqual({ quote: { calloutStatus: "LOCKED", calloutFee: 3500 },
    labour: { proBaseMajor: 3000, agreedMajor: 2500, currency: "NGN" } });
});
it("keeps missing persisted jobs at 404", async () => {
  mocks.job.mockResolvedValue(null); expect((await request()).status).toBe(404);
  expect(mocks.quote).not.toHaveBeenCalled();
});
it("keeps nonparty requests forbidden before resolving quotes", async () => {
  mocks.party.mockReturnValue(false); expect((await request()).status).toBe(403);
  expect(mocks.quote).not.toHaveBeenCalled();
});
it("preserves genuine storage failure handling", async () => {
  mocks.job.mockRejectedValue(new Error("unavailable")); expect((await request()).status).toBe(500);
  expect(mocks.quote).not.toHaveBeenCalled();
});

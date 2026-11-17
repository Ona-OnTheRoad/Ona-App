import { describe, expect, it, vi } from "vitest";
import { cancelSearchRequest } from "../cancel-search";

const input = { jobId: "job-1", motoristId: "cust-1" };
const deps = (transition: unknown, getJob: unknown = vi.fn()) =>
  ({ transition, getJob }) as unknown as Parameters<typeof cancelSearchRequest>[1];

describe("cancelSearchRequest", () => {
  it("sends the customer's CANCEL and reports success only once the server accepted it", async () => {
    const transition = vi.fn(async () => ({ ok: true, data: { job: { status: "cancelled" } } }));
    expect(await cancelSearchRequest(input, deps(transition))).toEqual({ ok: true });
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1", event: "CANCEL", actor: "motorist", actorId: "cust-1" }),
    );
  });

  it("does NOT report success when the cancel failed and the job is still searching", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "Network error" }));
    const getJob = vi.fn(async () => ({ ok: true, data: { job: { status: "sequential_pairing" } } }));
    const res = await cancelSearchRequest(input, deps(transition, getJob));
    expect(res.ok).toBe(false);
  });

  it("does NOT report success when the cancel throws and the status cannot be confirmed", async () => {
    const transition = vi.fn(async () => { throw new Error("offline"); });
    expect((await cancelSearchRequest(input, deps(transition))).ok).toBe(false);
  });

  it("treats a job the server already closed as cancelled", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "Illegal transition" }));
    for (const status of ["cancelled", "expired"]) {
      const getJob = vi.fn(async () => ({ ok: true, data: { job: { status } } }));
      expect(await cancelSearchRequest(input, deps(transition, getJob))).toEqual({ ok: true });
    }
  });

  it("does not treat a job that moved on (a pro took it) as cancelled", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "x" }));
    const getJob = vi.fn(async () => ({ ok: true, data: { job: { status: "negotiating" } } }));
    expect((await cancelSearchRequest(input, deps(transition, getJob))).ok).toBe(false);
  });
});

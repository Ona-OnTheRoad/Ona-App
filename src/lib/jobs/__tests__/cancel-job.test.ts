import { describe, expect, it, vi } from "vitest";
import { cancelJobConfirmed } from "../cancel-job";

const deps = (transition: unknown, getJob: unknown = vi.fn()) =>
  ({ transition, getJob }) as unknown as Parameters<typeof cancelJobConfirmed>[1];
const input = { jobId: "job-1", actor: "motorist" as const, actorId: "cust-1" };

describe("cancelJobConfirmed: never leave a request alive behind a 'cancelled' screen", () => {
  it("succeeds and returns the server's job when the CANCEL is accepted", async () => {
    const job = { id: "job-1", status: "cancelled" };
    const transition = vi.fn(async () => ({ ok: true, data: { job } }));
    expect(await cancelJobConfirmed(input, deps(transition))).toEqual({ ok: true, job });
  });

  it("FAILS when the CANCEL call errors and the job is still open on the server", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "timeout" }));
    const getJob = vi.fn(async () => ({ ok: true, data: { job: { status: "negotiating" } } }));
    expect((await cancelJobConfirmed(input, deps(transition, getJob))).ok).toBe(false);
  });

  it("FAILS when the network is down entirely (transition throws, status unknown)", async () => {
    const transition = vi.fn(async () => { throw new Error("offline"); });
    const res = await cancelJobConfirmed(input, deps(transition));
    expect(res.ok).toBe(false);
  });

  it("FAILS when the status check itself fails", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "x" }));
    const getJob = vi.fn(async () => ({ ok: false, message: "down" }));
    expect((await cancelJobConfirmed(input, deps(transition, getJob))).ok).toBe(false);
  });

  it("counts an already cancelled or expired job as done", async () => {
    const transition = vi.fn(async () => ({ ok: false, message: "illegal transition" }));
    for (const status of ["cancelled", "expired"]) {
      const getJob = vi.fn(async () => ({ ok: true, data: { job: { status } } }));
      expect((await cancelJobConfirmed(input, deps(transition, getJob))).ok).toBe(true);
    }
  });

  it("forwards the actor and reason", async () => {
    const transition = vi.fn(async () => ({ ok: true, data: { job: {} } }));
    await cancelJobConfirmed({ ...input, reason: "why" }, deps(transition));
    expect(transition).toHaveBeenCalledWith({ jobId: "job-1", event: "CANCEL", actor: "motorist", actorId: "cust-1", reason: "why" });
  });
});

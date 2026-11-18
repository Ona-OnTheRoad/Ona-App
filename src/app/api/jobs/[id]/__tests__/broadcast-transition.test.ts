import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  user: "pro-near",
  getJob: vi.fn(),
  openRequest: vi.fn(), declineRequest: vi.fn(), deferRequest: vi.fn(), confirmRequest: vi.fn(),
  reopenJobToPool: vi.fn(),
  transitionJob: vi.fn(),
  couldHaveSeen: vi.fn(),
  needsBank: vi.fn(),
}));

// Real isJobParty: the access rule is what is under test.
vi.mock("@/lib/server/auth-utils", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/auth-utils")>()),
  requireUser: async () => ({ ok: true, userId: m.user }),
}));
vi.mock("@/lib/server/jobs/job-store", () => ({
  getJob: m.getJob, rerouteDeclinedJob: vi.fn(), transitionJob: m.transitionJob,
}));
vi.mock("@/lib/server/pairing/pairing-engine", () => ({
  openRequest: m.openRequest, declineRequest: m.declineRequest, deferRequest: m.deferRequest,
  confirmRequest: m.confirmRequest, reopenJobToPool: m.reopenJobToPool,
}));
vi.mock("@/lib/server/pairing/broadcast", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/pairing/broadcast")>()),
  proCouldHaveSeenJob: m.couldHaveSeen,
}));
vi.mock("@/lib/server/payments/bank-lookup", () => ({
  proMustAddBankToAccept: m.needsBank,
}));
vi.mock("@/lib/server/google-eta", () => ({ computeDriveMetrics: vi.fn() }));
vi.mock("@/lib/server/structured-logger", () => ({ serverLogger: { warn: vi.fn(), error: vi.fn() } }));

import { POST } from "../transition/route";

const ctx = { params: Promise.resolve({ id: "job-1" }) };
const poolJob = {
  id: "job-1", motoristId: "cust-1", repairProId: "", status: "sequential_pairing",
  pairingStage: "sequential_pairing", problem: "car will not start",
};
const claimed = { ...poolJob, repairProId: "pro-near", status: "reserved", pairingStage: "reserved" };
const negotiating = { ...poolJob, repairProId: "pro-near", status: "negotiating", pairingStage: null };

const send = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/jobs/job-1/transition", { method: "POST", body: JSON.stringify(body) }), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  m.user = "pro-near";
  m.getJob.mockResolvedValue({ ...poolJob });
  m.openRequest.mockResolvedValue({ ok: true, jobId: "job-1", currentProId: "pro-near" });
  m.declineRequest.mockResolvedValue({ ok: true, jobId: "job-1" });
  m.deferRequest.mockResolvedValue({ ok: true, jobId: "job-1" });
  m.reopenJobToPool.mockResolvedValue({ ok: true, jobId: "job-1" });
  m.couldHaveSeen.mockResolvedValue(false);
  m.needsBank.mockResolvedValue(false);
});

describe("a pro acting on an open (unclaimed) broadcast job", () => {
  it("can Open it (that is the claim); the engine decides whether they may", async () => {
    const res = await send({ event: "OPEN", actor: "repair_pro" });
    expect(res.status).toBe(200);
    expect(m.openRequest).toHaveBeenCalledWith("job-1", "pro-near", undefined);
  });

  it("can Decline and Later without being assigned", async () => {
    expect((await send({ event: "DECLINE", actor: "repair_pro", reason: "busy" })).status).toBe(200);
    expect(m.declineRequest).toHaveBeenCalledWith("job-1", "pro-near", "busy");
    expect((await send({ event: "LATER", actor: "repair_pro" })).status).toBe(200);
    expect(m.deferRequest).toHaveBeenCalledWith("job-1", "pro-near");
  });

  it("surfaces the engine's 'already taken' answer to the losing pro", async () => {
    m.openRequest.mockResolvedValue({ ok: false, error: "Another pro has already taken this request", status: 409 });
    const res = await send({ event: "OPEN", actor: "repair_pro" });
    expect(res.status).toBe(409);
  });

  it("cannot CONFIRM (I can fix this) before claiming: that stays a party-only action", async () => {
    expect((await send({ event: "CONFIRM", actor: "repair_pro" })).status).toBe(403);
    expect(m.confirmRequest).not.toHaveBeenCalled();
  });

  it("cannot cancel or progress an open job it does not hold", async () => {
    expect((await send({ event: "CANCEL", actor: "repair_pro", reason: "x" })).status).toBe(403);
    expect((await send({ event: "START_TRIP", actor: "repair_pro" })).status).toBe(403);
    expect(m.transitionJob).not.toHaveBeenCalled();
  });

  it("the customer cannot Open their own job as a pro", async () => {
    m.user = "cust-1";
    expect((await send({ event: "OPEN", actor: "repair_pro" })).status).toBe(403);
    expect(m.openRequest).not.toHaveBeenCalled();
  });
});

describe("a pro without verified bank details cannot accept a job", () => {
  it("is stopped on Open and on I-can-fix-this, with a message that says how to fix it", async () => {
    m.needsBank.mockResolvedValue(true);
    for (const event of ["OPEN", "CONFIRM"]) {
      m.getJob.mockResolvedValue(event === "OPEN" ? { ...poolJob } : { ...claimed });
      const res = await send({ event, actor: "repair_pro" });
      expect(res.status).toBe(409);
      expect(JSON.stringify(await res.json())).toMatch(/bank details/i);
    }
    expect(m.openRequest).not.toHaveBeenCalled();
    expect(m.confirmRequest).not.toHaveBeenCalled();
  });

  it("can still decline or postpone a job", async () => {
    m.needsBank.mockResolvedValue(true);
    expect((await send({ event: "DECLINE", actor: "repair_pro" })).status).toBe(200);
    expect((await send({ event: "LATER", actor: "repair_pro" })).status).toBe(200);
  });
});

describe("once another pro holds the job", () => {
  it("a pro who never could have seen it still gets 403 on Open / Decline / Later", async () => {
    m.getJob.mockResolvedValue({ ...claimed, repairProId: "pro-other" });
    for (const event of ["OPEN", "DECLINE", "LATER"]) {
      expect((await send({ event, actor: "repair_pro" })).status).toBe(403);
    }
    expect(m.openRequest).not.toHaveBeenCalled();
    expect(m.declineRequest).not.toHaveBeenCalled();
  });

  it("a pro who could have seen it but lost the race is told it was taken (409), without acting on it", async () => {
    m.couldHaveSeen.mockResolvedValue(true);
    m.getJob.mockResolvedValue({ ...claimed, repairProId: "pro-other" });
    const res = await send({ event: "OPEN", actor: "repair_pro" });
    expect(res.status).toBe(409);
    expect(JSON.stringify(await res.json())).toMatch(/already taken/i);
    expect(m.openRequest).not.toHaveBeenCalled();
  });

  it("an eligible pro opening a job that has since closed gets a stale-request 409", async () => {
    m.couldHaveSeen.mockResolvedValue(true);
    m.getJob.mockResolvedValue({ ...poolJob, status: "cancelled", pairingStage: null });
    const res = await send({ event: "OPEN", actor: "repair_pro" });
    expect(res.status).toBe(409);
    expect(JSON.stringify(await res.json())).toMatch(/not open for this action/i);
  });

  it("the broadcast path is closed entirely in sequential rollback mode", async () => {
    vi.stubEnv("PAIRING_DISPATCH_MODE", "sequential");
    expect((await send({ event: "OPEN", actor: "repair_pro" })).status).toBe(403);
    vi.unstubAllEnvs();
  });
});

describe("the customer rejects the pro and re-opens the job", () => {
  beforeEach(() => {
    m.user = "cust-1";
    m.getJob.mockResolvedValue({ ...negotiating });
  });

  it("sends the job back to the pool", async () => {
    const res = await send({ event: "REOPEN", actor: "motorist", reason: "too expensive" });
    expect(res.status).toBe(200);
    expect(m.reopenJobToPool).toHaveBeenCalledWith("job-1", { by: "customer", note: "too expensive" });
  });

  it("works while the pro is still reviewing, too", async () => {
    m.getJob.mockResolvedValue({ ...claimed });
    expect((await send({ event: "REOPEN", actor: "motorist" })).status).toBe(200);
  });

  it("a pro cannot trigger it, nor can an outsider", async () => {
    m.user = "pro-near";
    expect((await send({ event: "REOPEN", actor: "repair_pro" })).status).toBe(403);
    m.user = "someone-else";
    expect((await send({ event: "REOPEN", actor: "motorist" })).status).toBe(403);
    expect(m.reopenJobToPool).not.toHaveBeenCalled();
  });

  it("reports why when the job can no longer be reopened (e.g. already paid)", async () => {
    m.reopenJobToPool.mockResolvedValue({ ok: false, error: "This request can no longer be reopened", status: 409 });
    expect((await send({ event: "REOPEN", actor: "motorist" })).status).toBe(409);
  });

  it("is unavailable in sequential rollback mode", async () => {
    vi.stubEnv("PAIRING_DISPATCH_MODE", "sequential");
    expect((await send({ event: "REOPEN", actor: "motorist" })).status).toBe(409);
    expect(m.reopenJobToPool).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

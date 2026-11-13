import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/lib/server/auth-utils", () => ({ requireUser: m.requireUser }));
vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: m.requireAdmin,
  AdminAuthError: class extends Error { status = 401; },
}));
vi.mock("@/lib/server/security/contact-changes", async (orig) => ({
  ...(await orig<typeof import("@/lib/server/security/contact-changes")>()),
  createContactChangeRequest: m.create,
  getContactChangeRequest: m.get,
  listContactChangeRequests: m.list,
  updateContactChangeStatus: m.update,
  verifyContactChangeCode: m.verify,
}));

import { GET, PATCH, POST } from "../route";

const withCodes = (over: Record<string, unknown> = {}) => ({
  id: "r1", userId: "user-1", changeType: "phone", oldValue: "a", newValue: "b",
  oldCode: "123456", newCode: "654321", status: "awaiting_old_verification", ...over,
});
const req = (method: string, body?: unknown, url = "https://ona.test/api/security/contact-change") =>
  new Request(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

beforeEach(() => {
  vi.resetAllMocks();
  m.requireUser.mockResolvedValue({ ok: true, userId: "user-1" });
  m.requireAdmin.mockResolvedValue({ session: { userId: "admin-1" } });
});

const unauthenticated = () =>
  m.requireUser.mockResolvedValue({ ok: false, response: Response.json({ ok: false, error: { message: "Not authenticated" } }, { status: 401 }) });

describe("/api/security/contact-change is no longer open to the public", () => {
  it("POST without a session is 401 and creates nothing", async () => {
    unauthenticated();
    const res = await POST(req("POST", { userId: "victim", changeType: "email", oldValue: "a", newValue: "b" }));
    expect(res.status).toBe(401);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("POST cannot open a request for someone else's account", async () => {
    const res = await POST(req("POST", { userId: "victim", changeType: "email", oldValue: "a", newValue: "b" }));
    expect(res.status).toBe(403);
    expect(m.create).not.toHaveBeenCalled();
  });

  it("POST uses the signed-in user's id and never returns the codes", async () => {
    m.create.mockResolvedValue({ request: withCodes() });
    const res = await POST(req("POST", { changeType: "phone", oldValue: "a", newValue: "b" }));
    expect(res.status).toBe(200);
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
    const body = JSON.stringify(await res.json());
    expect(body).not.toContain("123456");
    expect(body).not.toContain("654321");
  });

  it("GET without a session is 401", async () => {
    unauthenticated();
    expect((await GET(req("GET", undefined, "https://ona.test/api/security/contact-change?userId=victim"))).status).toBe(401);
    expect(m.list).not.toHaveBeenCalled();
  });

  it("GET by id answers 404 for a request that belongs to someone else (no existence oracle)", async () => {
    m.get.mockResolvedValue(withCodes({ userId: "user-2" }));
    const res = await GET(req("GET", undefined, "https://ona.test/api/security/contact-change?id=r1"));
    expect(res.status).toBe(404);
  });

  it("GET by id returns the caller's own request with codes redacted", async () => {
    m.get.mockResolvedValue(withCodes());
    const res = await GET(req("GET", undefined, "https://ona.test/api/security/contact-change?id=r1"));
    expect(res.status).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("r1");
    expect(text).not.toContain("123456");
  });

  it("GET list is always scoped to the caller, whatever userId the query string says", async () => {
    m.list.mockResolvedValue([withCodes()]);
    const res = await GET(req("GET", undefined, "https://ona.test/api/security/contact-change?userId=victim&status=pending"));
    expect(res.status).toBe(200);
    expect(m.list).toHaveBeenCalledWith({ status: "pending", userId: "user-1" });
    expect(JSON.stringify(await res.json())).not.toContain("654321");
  });

  it("PATCH stays admin-only and redacts codes", async () => {
    m.requireAdmin.mockRejectedValue(new Error("no"));
    expect((await PATCH(req("PATCH", { id: "r1", status: "approved" }))).status).toBe(401);
    m.requireAdmin.mockResolvedValue({ session: { userId: "admin-1" } });
    m.update.mockResolvedValue({ request: withCodes({ status: "approved" }) });
    const ok = await PATCH(req("PATCH", { id: "r1", status: "approved" }));
    expect(ok.status).toBe(200);
    expect(JSON.stringify(await ok.json())).not.toContain("123456");
  });
});

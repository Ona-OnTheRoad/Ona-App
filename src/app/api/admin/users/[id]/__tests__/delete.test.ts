import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdmin: vi.fn(),
  requireSensitiveAction: vi.fn(),
  logAdminAction: vi.fn(),
  clientIp: () => "1.1.1.1",
  userAgent: () => "test",
  AdminAuthError: class extends Error {
    code?: string;
    constructor(message: string, public status = 401, code?: string) {
      super(message);
      this.code = code;
    }
  },
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
import {
  AdminAuthError,
  logAdminAction,
  requireSensitiveAction,
} from "@/lib/server/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { DELETE } from "@/app/api/admin/users/[id]/route";

type Opts = {
  profile?: { id: string; role: string; full_name: string; email: string } | null;
  deleteError?: { message: string } | null;
  scrubError?: { message: string } | null;
};

function mockDb({ profile = { id: "user-1", role: "motorist", full_name: "Ada", email: "a@x.com" }, deleteError = null, scrubError = null }: Opts = {}) {
  const updates: unknown[] = [];
  const tablesTouched: string[] = [];
  const auth = {
    admin: {
      deleteUser: vi.fn(async () => ({ error: deleteError })),
      updateUserById: vi.fn(async () => ({ error: null })),
    },
  };
  const from = vi.fn((table: string) => {
    tablesTouched.push(table);
    return {
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: profile, error: null }) }),
      }),
      update: (patch: unknown) => {
        updates.push(patch);
        return { eq: async () => ({ error: scrubError }) };
      },
      delete: () => {
        throw new Error("history must never be deleted");
      },
    };
  });
  vi.mocked(createServiceSupabase).mockReturnValue({ from, auth } as never);
  return { auth, updates, tablesTouched };
}

const req = () => new Request("https://ona.test/api/admin/users/user-1", { method: "DELETE" });
const ctx = (id = "user-1") => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireSensitiveAction).mockResolvedValue({ session: { userId: "admin-1" } } as never);
});

describe("DELETE /api/admin/users/[id]", () => {
  it("hard-deletes the auth user and never touches history tables", async () => {
    const db = mockDb();
    const res = await DELETE(req(), ctx());
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ deleted: true, anonymized: false, id: "user-1" });
    expect(db.auth.admin.deleteUser).toHaveBeenCalledWith("user-1");
    expect(db.tablesTouched).toEqual(["profiles"]);
    expect(logAdminAction).toHaveBeenCalledWith("admin-1", "delete_user", "user-1", expect.anything());
  });

  it("anonymises and bans the account when history blocks the delete", async () => {
    const db = mockDb({ deleteError: { message: "violates foreign key constraint" } });
    const res = await DELETE(req(), ctx());
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data.anonymized).toBe(true);
    expect(db.updates).toEqual([
      { full_name: "Deleted user", email: null, phone: null, avatar_url: null, city: null, area: null, is_active: false },
    ]);
    expect(db.auth.admin.updateUserById).toHaveBeenCalledWith("user-1", expect.objectContaining({ ban_duration: expect.any(String) }));
    expect(db.tablesTouched.every((t) => t === "profiles")).toBe(true);
    expect(logAdminAction).toHaveBeenCalledWith("admin-1", "anonymize_user", "user-1", expect.anything());
  });

  it("returns 500 when the fallback scrub also fails", async () => {
    mockDb({ deleteError: { message: "fk" }, scrubError: { message: "db down" } });
    const res = await DELETE(req(), ctx());
    expect(res.status).toBe(500);
    expect(logAdminAction).toHaveBeenCalledWith("admin-1", "delete_user_failed", "user-1", expect.anything());
  });

  it("refuses to delete yourself", async () => {
    const db = mockDb();
    const res = await DELETE(req(), ctx("admin-1"));
    expect(res.status).toBe(400);
    expect(db.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it.each(["super_admin", "customer_care", "admin"])("protects %s staff accounts", async (role) => {
    const db = mockDb({ profile: { id: "user-1", role, full_name: "S", email: "s@x.com" } });
    const res = await DELETE(req(), ctx());
    expect(res.status).toBe(403);
    expect(db.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown user", async () => {
    mockDb({ profile: null });
    expect((await DELETE(req(), ctx())).status).toBe(404);
  });

  it("surfaces the sensitive-action lock", async () => {
    vi.mocked(requireSensitiveAction).mockRejectedValue(new AdminAuthError("locked", 403, "sensitive_locked"));
    const res = await DELETE(req(), ctx());
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("sensitive_locked");
  });
});

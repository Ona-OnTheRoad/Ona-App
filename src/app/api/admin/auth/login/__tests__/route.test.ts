import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anonSignIn: vi.fn(),
  serviceSignIn: vi.fn(),
  from: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mocks.cookieSet,
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mocks.anonSignIn,
    },
  })),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  getSupabaseUrl: vi.fn(() => "http://localhost"),
  getSupabaseAnonKey: vi.fn(() => "anon"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(() => ({
    auth: {
      signInWithPassword: mocks.serviceSignIn,
    },
    from: mocks.from,
  })),
}));

import { POST } from "../route";

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-for-admin-session";
});

describe("POST /api/admin/auth/login", () => {
  it("authenticates via separate client and queries profiles under unmutated service client", async () => {
    mocks.anonSignIn.mockResolvedValue({
      data: {
        user: { id: "admin-123", email: "admin@example.com" },
        session: {
          access_token: "admin-access-token",
          refresh_token: "admin-refresh-token",
          expires_at: 1800000000,
        },
      },
      error: null,
    });

    mocks.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "admin-123",
          email: "admin@example.com",
          full_name: "Super Admin",
          role: "admin",
          admin_role: "super_admin",
          is_active: true,
        },
        error: null,
      }),
    });

    const res = await POST(
      makeReq({
        email: "admin@example.com",
        password: "AdminSecretPassword123!",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.user.id).toBe("admin-123");

    // Anon client was called with credentials
    expect(mocks.anonSignIn).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "AdminSecretPassword123!",
    });

    // Service client never called signInWithPassword
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();

    // Profiles query called via service client
    expect(mocks.from).toHaveBeenCalledWith("profiles");

    // Admin session cookie was set
    expect(mocks.cookieSet).toHaveBeenCalled();
  });

  it("returns 401 when login credentials fail without querying profiles", async () => {
    mocks.anonSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const res = await POST(
      makeReq({
        email: "admin@example.com",
        password: "WrongPassword!",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error.code).toBe("invalid_credentials");
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

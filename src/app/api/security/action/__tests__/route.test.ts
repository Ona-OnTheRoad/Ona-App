import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  anonSignIn: vi.fn(),
  serviceSignIn: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
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
      getUser: mocks.getUser,
      signInWithPassword: mocks.serviceSignIn,
      admin: {
        getUserById: mocks.getUserById,
        updateUserById: mocks.updateUserById,
      },
    },
    from: mocks.from,
  })),
}));

import { POST } from "../route";

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/security/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-123" } },
    error: null,
  });
  mocks.getUserById.mockResolvedValue({
    data: { user: { id: "user-123", email: "user@example.com" } },
    error: null,
  });
  mocks.updateUserById.mockResolvedValue({
    data: { user: { id: "user-123" } },
    error: null,
  });
  mocks.from.mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: null }),
  });
});

describe("POST /api/security/action (change_password)", () => {
  it("verifies current password on separate anon client and never calls signInWithPassword on service client", async () => {
    mocks.anonSignIn.mockResolvedValue({
      data: { session: {}, user: { id: "user-123" } },
      error: null,
    });

    const res = await POST(
      makeReq({
        action: "change_password",
        accessToken: "valid-user-access-token-123",
        currentPassword: "OldPassword1!",
        newValue: "NewPassword2@",
        confirmValue: "NewPassword2@",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.updated).toBe(true);

    // Assert anon client was used for verification
    expect(mocks.anonSignIn).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "OldPassword1!",
    });

    // Assert service client was NEVER called for signInWithPassword
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();

    // Assert admin API was used to update password
    expect(mocks.updateUserById).toHaveBeenCalledWith("user-123", {
      password: "NewPassword2@",
    });
  });

  it("returns 403 when current password is wrong, without calling admin updateUserById", async () => {
    mocks.anonSignIn.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    const res = await POST(
      makeReq({
        action: "change_password",
        accessToken: "valid-user-access-token-123",
        currentPassword: "WrongPassword!",
        newValue: "NewPassword2@",
        confirmValue: "NewPassword2@",
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(403);
    expect(json.error.message).toBe("Current password is incorrect");
    expect(mocks.serviceSignIn).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });
});

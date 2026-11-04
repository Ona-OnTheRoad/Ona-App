import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { POST } from "@/app/api/messages/read/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(body: unknown) {
  return new Request("http://localhost/api/messages/read", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

type ConvRow = {
  id: string;
  motorist_id: string;
  repair_pro_id: string;
};

function makeSb(opts: {
  conv?: { data: ConvRow | null; error?: { message: string } | null };
  updateError?: { message: string } | null;
}) {
  const conv = opts.conv ?? {
    data: {
      id: "conv-1",
      motorist_id: "11111111-1111-4111-8111-111111111111",
      repair_pro_id: "22222222-2222-4222-8222-222222222222",
    },
    error: null,
  };
  const updateResult = { error: opts.updateError ?? null };
  const messagesUpdate = vi.fn(() => ({
    eq: vi.fn(() => ({
      neq: vi.fn(() => ({
        is: vi.fn(async () => updateResult),
      })),
    })),
  }));

  const sb = {
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => conv),
            })),
          })),
        };
      }
      if (table === "messages") {
        return { update: messagesUpdate };
      }
      throw new Error(`unexpected table ${table}`);
    }),
    messagesUpdate,
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

const MOTORIST = "11111111-1111-4111-8111-111111111111";
const PRO = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("POST /api/messages/read", () => {
  it("marks peer messages read when the caller is a participant", async () => {
    requireUserMock.mockResolvedValue(authOk(MOTORIST));
    const sb = makeSb({});

    const res = await POST(
      req({ conversationId: "conv-1", userId: MOTORIST }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.ok).toBe(true);
    expect(sb.messagesUpdate).toHaveBeenCalledWith({
      read_at: expect.any(String),
    });
  });

  it("rejects a signed-in user who is not a conversation participant", async () => {
    requireUserMock.mockResolvedValue(authOk(OTHER));
    const sb = makeSb({});

    const res = await POST(req({ conversationId: "conv-1", userId: OTHER }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
    expect(sb.messagesUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the conversation does not exist", async () => {
    requireUserMock.mockResolvedValue(authOk(MOTORIST));
    const sb = makeSb({ conv: { data: null, error: null } });

    const res = await POST(
      req({ conversationId: "missing", userId: MOTORIST }),
    );
    expect(res.status).toBe(404);
    expect(sb.messagesUpdate).not.toHaveBeenCalled();
  });

  it("rejects when body userId does not match the session", async () => {
    requireUserMock.mockResolvedValue(authOk(MOTORIST));
    const sb = makeSb({});

    const res = await POST(req({ conversationId: "conv-1", userId: PRO }));
    expect(res.status).toBe(403);
    expect(sb.from).not.toHaveBeenCalled();
  });
});

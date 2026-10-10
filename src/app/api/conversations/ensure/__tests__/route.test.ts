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
import { POST } from "@/app/api/conversations/ensure/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(body: unknown) {
  return new Request("http://localhost/api/conversations/ensure", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

type JobRow = {
  id: string;
  motorist_id: string;
  repair_pro_id: string | null;
};

function makeSb(opts: {
  job?: { data: JobRow | null; error?: { message: string } | null };
  existing?: { data: { id: string } | null; error?: { message: string } | null };
  insertResult?: {
    data: { id: string } | null;
    error?: { message: string } | null;
  };
}) {
  const job = opts.job ?? {
    data: { id: "req-1", motorist_id: "motorist-1", repair_pro_id: "pro-1" },
    error: null,
  };
  const existing = opts.existing ?? { data: null, error: null };
  const insertResult = opts.insertResult ?? {
    data: { id: "conv-1" },
    error: null,
  };

  const conversationsTable = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => existing),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => insertResult),
      })),
    })),
  };
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "service_requests") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => job),
            })),
          })),
        };
      }
      if (table === "conversations") {
        return conversationsTable;
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("POST /api/conversations/ensure", () => {
  it("creates a conversation using the service_requests row's own party ids", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const sb = makeSb({});

    const res = await POST(
      req({
        requestId: "req-1",
        // Client-supplied party ids, deliberately wrong -- must be ignored.
        motoristId: "attacker",
        repairProId: "attacker-pro",
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ conversationId: "conv-1" });
    const conversationsTable = sb.from.mock.results.find(
      (_r, i) => sb.from.mock.calls[i][0] === "conversations",
    )!.value as { insert: ReturnType<typeof vi.fn> };
    expect(conversationsTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        motorist_id: "motorist-1",
        repair_pro_id: "pro-1",
      }),
    );
  });

  it("returns the existing conversation id without inserting", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const sb = makeSb({ existing: { data: { id: "conv-existing" }, error: null } });

    const res = await POST(req({ requestId: "req-1" }));
    const json = await res.json();

    expect(json.data).toEqual({ conversationId: "conv-existing" });
    const conversationsTable = sb.from.mock.results.find(
      (_r, i) => sb.from.mock.calls[i][0] === "conversations",
    )!.value as { insert: ReturnType<typeof vi.fn> };
    expect(conversationsTable.insert).not.toHaveBeenCalled();
  });

  it("rejects a caller who isn't the motorist or repair pro on the request", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    makeSb({});

    const res = await POST(req({ requestId: "req-1" }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when the request doesn't exist", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ job: { data: null, error: null } });

    const res = await POST(req({ requestId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when the request has no repair pro assigned yet", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({
      job: {
        data: { id: "req-1", motorist_id: "motorist-1", repair_pro_id: null },
        error: null,
      },
    });

    const res = await POST(req({ requestId: "req-1" }));
    expect(res.status).toBe(400);
  });

  it("rejects a body missing requestId", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({});

    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });
});

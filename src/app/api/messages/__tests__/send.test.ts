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

vi.mock("@/lib/server/notifications", () => ({
  insertNotification: vi.fn(async () => ({ id: "notif-1" })),
}));

import { requireUser } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { insertNotification } from "@/lib/server/notifications";
import { serverLogger } from "@/lib/server/structured-logger";
import { POST } from "@/app/api/messages/send/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);
const insertNotificationMock = vi.mocked(insertNotification);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(body: unknown) {
  return new Request("http://localhost/api/messages/send", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer t" },
    body: JSON.stringify(body),
  });
}

type ConvRow = {
  id: string;
  motorist_id: string;
  repair_pro_id: string;
  request_id: string | null;
};

function makeSb(opts: {
  conv?: { data: ConvRow | null; error?: { message: string } | null };
  insertResult?: {
    data: { id: string; created_at: string } | null;
    error?: { message: string } | null;
  };
  updateError?: { message: string } | null;
}) {
  const conv = opts.conv ?? {
    data: { id: "conv-1", motorist_id: "motorist-1", repair_pro_id: "pro-1", request_id: "job-1" },
    error: null,
  };
  const insertResult = opts.insertResult ?? {
    data: { id: "msg-1", created_at: "2026-10-10T00:00:00.000Z" },
    error: null,
  };
  const updateResult = { error: opts.updateError ?? null };

  const sb = {
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => conv),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => updateResult),
          })),
        };
      }
      if (table === "messages") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => insertResult),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { full_name: "Sender" } })),
            })),
          })),
        };
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
  insertNotificationMock.mockResolvedValue({ id: "notif-1" });
});

describe("POST /api/messages/send", () => {
  it("inserts the message, updates the conversation, and notifies the other party", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({});

    const res = await POST(req({ conversationId: "conv-1", body: "hello" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toEqual({ id: "msg-1", createdAt: "2026-10-10T00:00:00.000Z" });
    expect(insertNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "pro-1", category: "messages" }),
    );
  });

  it("derives sender_id from the session, never from the request body", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const sb = makeSb({});

    await POST(req({ conversationId: "conv-1", body: "hello" }));

    const messagesFrom = sb.from.mock.results.find(
      (_r, i) => sb.from.mock.calls[i][0] === "messages",
    );
    expect(messagesFrom).toBeDefined();
    const insertCall = (messagesFrom!.value as { insert: ReturnType<typeof vi.fn> }).insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ sender_id: "motorist-1" }),
    );
  });

  it("rejects a sender who is not a participant in the conversation", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    makeSb({});

    const res = await POST(req({ conversationId: "conv-1", body: "hello" }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
  });

  it("returns 404 when the conversation does not exist", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ conv: { data: null, error: null } });

    const res = await POST(req({ conversationId: "missing", body: "hello" }));
    expect(res.status).toBe(404);
  });

  it("fails the request when the message insert fails", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ insertResult: { data: null, error: { message: "insert failed" } } });

    const res = await POST(req({ conversationId: "conv-1", body: "hello" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe("insert failed");
    expect(insertNotificationMock).not.toHaveBeenCalled();
  });

  it("still returns success when the conversation timestamp update fails, but logs a warning", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ updateError: { message: "update failed" } });
    const warnSpy = vi.spyOn(serverLogger, "warn").mockImplementation(() => {});

    const res = await POST(req({ conversationId: "conv-1", body: "hello" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      "messages.send.conversation_timestamp_failed",
      expect.objectContaining({ outcome: "conversation_update_failed" }),
      expect.anything(),
      expect.anything(),
    );
    warnSpy.mockRestore();
  });

  it("rejects a body missing required fields", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({});

    const res = await POST(req({ conversationId: "conv-1" }));
    expect(res.status).toBe(400);
  });
});

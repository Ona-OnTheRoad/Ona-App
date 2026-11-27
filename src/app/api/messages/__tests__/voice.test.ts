import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));

import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { POST } from "@/app/api/messages/voice/route";

const requireUserMock = vi.mocked(requireUser);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(opts: { mime?: string; bytes?: number; qs?: string } = {}) {
  return new Request(
    `http://localhost/api/messages/voice?${opts.qs ?? "conversationId=conv-1"}`,
    {
      method: "POST",
      headers: {
        "content-type": opts.mime ?? "audio/webm;codecs=opus",
        authorization: "Bearer t",
      },
      body: new Uint8Array(opts.bytes ?? 2048),
    },
  );
}

function makeSb(conv: unknown, uploadError: { message: string } | null = null) {
  const upload = vi.fn(async () => ({ error: uploadError }));
  const sb = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: conv })) })),
      })),
    })),
    storage: { from: vi.fn(() => ({ upload })) },
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return { sb, upload };
}

const CONV = { id: "conv-1", motorist_id: "motorist-1", repair_pro_id: "pro-1" };

beforeEach(() => vi.clearAllMocks());

describe("POST /api/messages/voice", () => {
  it("stores the audio under the sender's own folder and returns the key", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const { upload } = makeSb(CONV);

    const res = await POST(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.key).toMatch(/^conv-1\/motorist-1\/[0-9a-f-]+\.webm$/);
    expect(json.data.mime).toBe("audio/webm");
    expect(upload).toHaveBeenCalledWith(
      json.data.key,
      expect.any(Buffer),
      expect.objectContaining({ contentType: "audio/webm", upsert: false }),
    );
  });

  it("rejects someone who is not in the conversation", async () => {
    requireUserMock.mockResolvedValue(authOk("stranger"));
    const { upload } = makeSb(CONV);
    expect((await POST(req())).status).toBe(403);
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown conversation", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb(null);
    expect((await POST(req())).status).toBe(404);
  });

  it("rejects non-audio uploads", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb(CONV);
    expect((await POST(req({ mime: "text/html" }))).status).toBe(415);
  });

  it("rejects files over 3 MB", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    const { upload } = makeSb(CONV);
    expect((await POST(req({ bytes: 3 * 1024 * 1024 + 1 }))).status).toBe(413);
    expect(upload).not.toHaveBeenCalled();
  });

  it("requires a conversationId", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb(CONV);
    expect((await POST(req({ qs: "" }))).status).toBe(400);
  });

  it("reports a storage failure", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb(CONV, { message: "bucket missing" });
    expect((await POST(req())).status).toBe(500);
  });
});

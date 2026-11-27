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
import { GET } from "@/app/api/conversations/route";

const requireUserMock = vi.mocked(requireUser);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function authOk(userId: string): Awaited<ReturnType<typeof requireUser>> {
  return { ok: true, userId, email: null, token: "t", user: {} as never };
}

function req(qs: string) {
  return new Request(`http://localhost/api/conversations?${qs}`, {
    headers: { authorization: "Bearer t" },
  });
}

function makeSb(opts: {
  convs?: {
    data:
      | {
          id: string;
          motorist_id: string;
          repair_pro_id: string;
          request_id: string | null;
        }[]
      | null;
    error?: { message: string } | null;
  };
  msgs?: { data: unknown[] | null };
  profiles?: { data: { id: string; full_name: string; avatar_url: string | null }[] | null };
  jobs?: { data: { id: string; service_type: string }[] | null };
  signed?: { path: string; signedUrl: string }[];
}) {
  const convs = opts.convs ?? { data: [], error: null };
  const msgs = opts.msgs ?? { data: [] };
  const profiles = opts.profiles ?? { data: [] };
  const jobs = opts.jobs ?? { data: [] };
  const sb = {
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: vi.fn(async () => ({
          data: (opts.signed ?? []).map((r) => ({ ...r, error: null })),
          error: null,
        })),
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => convs),
              })),
            })),
          })),
        };
      }
      if (table === "messages") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(async () => msgs),
              })),
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => profiles),
          })),
        };
      }
      if (table === "service_requests") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(async () => jobs),
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
});

describe("GET /api/conversations", () => {
  it("returns mapped threads for the caller's own motorist conversations", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({
      convs: {
        data: [
          {
            id: "conv-1",
            motorist_id: "motorist-1",
            repair_pro_id: "pro-1",
            request_id: "req-1",
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          { id: "motorist-1", full_name: "Mo Torist", avatar_url: null },
          { id: "pro-1", full_name: "Jane Pro", avatar_url: "pic.png" },
        ],
      },
      jobs: { data: [{ id: "req-1", service_type: "mechanic" }] },
    });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.threads).toHaveLength(1);
    expect(json.data.threads[0]).toMatchObject({
      id: "conv-1",
      technicianId: "pro-1",
      technicianName: "Jane Pro",
      motoristName: "Mo Torist",
      serviceType: "mechanic",
    });
  });

  it("returns 403 when userId doesn't match the session", async () => {
    requireUserMock.mockResolvedValue(authOk("someone-else"));
    makeSb({});

    const res = await GET(req("userId=motorist-1&role=motorist"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when role is missing or invalid", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({});

    const res = await GET(req("userId=motorist-1&role=bogus"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when the caller is not authenticated", async () => {
    requireUserMock.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ ok: false }), { status: 401 }),
    });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    expect(res.status).toBe(401);
  });

  it("returns 500 on a database error", async () => {
    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ convs: { data: null, error: { message: "db down" } } });

    const res = await GET(req("userId=motorist-1&role=motorist"));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.message).toBe("db down");
  });

  it("gives each side the OTHER party's photo, for both the customer and the pro", async () => {
    const conv = {
      id: "conv-1",
      motorist_id: "motorist-1",
      repair_pro_id: "pro-1",
      request_id: null,
    };
    const profiles = {
      data: [
        { id: "motorist-1", full_name: "Freddy Feyy", avatar_url: "customer.png" },
        { id: "pro-1", full_name: "Jane Pro", avatar_url: "pro.png" },
      ],
    };

    requireUserMock.mockResolvedValue(authOk("pro-1"));
    makeSb({ convs: { data: [conv], error: null }, profiles });
    const asPro = await (await GET(req("userId=pro-1&role=professional"))).json();
    expect(asPro.data.threads[0]).toMatchObject({
      motoristName: "Freddy Feyy",
      motoristPhoto: "customer.png",
      photo: "pro.png",
    });

    requireUserMock.mockResolvedValue(authOk("motorist-1"));
    makeSb({ convs: { data: [conv], error: null }, profiles });
    const asCustomer = await (
      await GET(req("userId=motorist-1&role=motorist"))
    ).json();
    expect(asCustomer.data.threads[0]).toMatchObject({
      technicianName: "Jane Pro",
      photo: "pro.png",
      motoristPhoto: "customer.png",
    });
  });

  it("marks who sent each message from the conversation, and signs voice note URLs", async () => {
    requireUserMock.mockResolvedValue(authOk("pro-1"));
    makeSb({
      convs: {
        data: [
          { id: "conv-1", motorist_id: "motorist-1", repair_pro_id: "pro-1", request_id: null },
        ],
        error: null,
      },
      msgs: {
        data: [
          {
            id: "m2",
            conversation_id: "conv-1",
            sender_id: "motorist-1",
            body: JSON.stringify({
              text: "Voice note",
              voiceKey: "conv-1/motorist-1/a.webm",
              voiceDurationSec: 4,
              voiceMime: "audio/webm",
            }),
            created_at: "2026-11-27T10:01:00.000Z",
            read_at: null,
          },
          {
            id: "m1",
            conversation_id: "conv-1",
            sender_id: "pro-1",
            body: "On my way",
            created_at: "2026-11-27T10:00:00.000Z",
            read_at: null,
          },
        ],
      },
      signed: [
        { path: "conv-1/motorist-1/a.webm", signedUrl: "https://signed.example/a" },
      ],
    });

    const json = await (await GET(req("userId=pro-1&role=professional"))).json();
    const [first, second] = json.data.threads[0].messages;
    expect(first).toMatchObject({ sender: "professional", text: "On my way" });
    expect(second).toMatchObject({
      sender: "motorist",
      voiceUrl: "https://signed.example/a",
      voiceKey: "conv-1/motorist-1/a.webm",
      voiceDurationSec: 4,
    });
  });
});

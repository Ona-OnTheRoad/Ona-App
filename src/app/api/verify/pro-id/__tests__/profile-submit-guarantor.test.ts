import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  service: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: mocks.service }));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: () => true,
  getSupabaseUrl: () => "https://example.test",
  getSupabaseAnonKey: () => "anon",
}));

import { POST } from "@/app/api/verify/pro-id/route";

function makeReq(body: Record<string, unknown>) {
  return new Request("https://ona.test/api/verify/pro-id", {
    method: "POST",
    body: JSON.stringify({ access_token: "valid-token-12345", ...body }),
  });
}

function setup(tables: Record<string, Row[]>) {
  const sb = new FakeSupabase(tables);
  mocks.service.mockReturnValue(sb);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
});

describe("POST /api/verify/pro-id profile_submit guarantor persistence", () => {
  it("merges partial onboarding guarantor with existing signup details instead of erasing them", async () => {
    const sb = setup({
      profiles: [{ id: "user-1", role: "repair_pro" }],
      repair_pro_profiles: [
        {
          user_id: "user-1",
          primary_service: "mechanic",
          status: "pending",
          guarantor: {
            fullName: "Bola Guarantor",
            phone: "08012345678",
            address: "12 Allen Ave, Ikeja",
            occupation: "Civil Servant",
            relationship: "Uncle",
          },
        },
      ],
      repair_pro_guarantors: [
        {
          user_id: "user-1",
          full_name: "Bola Guarantor",
          phone: "08012345678",
          address: "12 Allen Ave, Ikeja",
          occupation: "Civil Servant",
          relationship: "Uncle",
        },
      ],
    });

    const res = await POST(
      makeReq({
        kind: "profile_submit",
        primaryService: "mechanic",
        businessName: "Ada Autos",
        guarantor: {
          fullName: "Bola Guarantor",
          phone: "08012345678",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(sb.rows.repair_pro_guarantors[0]).toMatchObject({
      full_name: "Bola Guarantor",
      phone: "08012345678",
      address: "12 Allen Ave, Ikeja",
      occupation: "Civil Servant",
      relationship: "Uncle",
    });
    expect(sb.rows.repair_pro_profiles[0].guarantor).toEqual({
      fullName: "Bola Guarantor",
      phone: "08012345678",
      address: "12 Allen Ave, Ikeja",
      occupation: "Civil Servant",
      relationship: "Uncle",
    });
  });

  it("returns 500 when guarantor persistence fails instead of swallowing the error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = {
      from: (table: string) => {
        if (table === "repair_pro_guarantors") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
            }),
            upsert: async () => ({
              data: null,
              error: { message: "guarantor db error" },
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { user_id: "user-1", primary_service: "mechanic", status: "pending" },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      },
    };
    mocks.service.mockReturnValue(sb);

    const res = await POST(
      makeReq({
        kind: "profile_submit",
        primaryService: "mechanic",
        guarantor: {
          fullName: "Bola Guarantor",
          phone: "08012345678",
          relationship: "Brother",
        },
      }),
    );

    expect(res.status).toBe(500);
    expect((await res.json()).error.message).toBe("guarantor db error");
  });
});

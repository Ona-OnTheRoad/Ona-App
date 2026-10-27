import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/server/market-scope", () => ({
  resolveMarketViewer: vi.fn(() => Promise.resolve({ trade: null })),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  getSupabaseUrl: vi.fn(() => "http://localhost"),
  getSupabaseAnonKey: vi.fn(() => "anon"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/server/auth-utils";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GET } from "@/app/api/pros/route";

const getUserFromRequestMock = vi.mocked(getUserFromRequest);
const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function req(url = "http://localhost/api/pros?lat=6.5244&lng=3.3792") {
  return new Request(url);
}

function makePro(overrides: Partial<Record<string, unknown>> = {}) {
  const nowIso = new Date().toISOString();
  return {
    user_id: "pro-1",
    business_name: "Pro One",
    primary_service: "mechanic",
    services: ["mechanic"],
    status: "approved",
    is_online: true,
    rating_avg: 4.8,
    rating_count: 12,
    lat: 6.5244,
    lng: 3.3792,
    location_updated_at: nowIso,
    service_radius_km: 5,
    years_experience: 5,
    bio: "Test bio",
    verified: true,
    labour_prices: {},
    pricing_currency: "NGN",
    vehicle_focus: null,
    skills: [],
    jobs_completed: 10,
    avg_response_minutes: 5,
    completion_rate: 98,
    docs_status: "approved",
    face_liveness_verified: true,
    in_person_verified: false,
    visibility_tier: 4,
    is_new_artisan: false,
    go_live_window_ends_at: null,
    ...overrides,
  };
}

function makeProfile(userId: string, role = "repair_pro") {
  return {
    id: userId,
    full_name: `User ${userId}`,
    email: `${userId}@example.com`,
    role,
    avatar_url: null,
    phone: "+2348011111111",
  };
}

function mockSupabase(pros: unknown[], profiles: unknown[]) {
  const sb = {
    from: vi.fn((table: string) => {
      if (table === "repair_pro_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: pros, error: null }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: profiles, error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
      };
    }),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
  getUserFromRequestMock.mockResolvedValue(null);
});

describe("GET /api/pros", () => {
  it("enforces DOCS_PENDING_MAX_RADIUS_KM (2.0 km) for docs under_review or rejected", async () => {
    // Lagos user at { lat: 6.5244, lng: 3.3792 }
    // 0.01 deg lat ~ 1.11 km
    // pro-close: ~1.33 km away (6.5244 + 0.012) -> under review, should be INCLUDED
    // pro-far: ~2.8 km away (6.5244 + 0.025) -> under review, should be EXCLUDED
    // pro-rejected-far: ~2.8 km away (6.5244 + 0.025) -> rejected, should be EXCLUDED
    // pro-approved-far: ~2.8 km away (6.5244 + 0.025) -> approved, should be INCLUDED
    const pros = [
      makePro({
        user_id: "pro-close-pending",
        lat: 6.5244 + 0.012,
        lng: 3.3792,
        docs_status: "under_review",
      }),
      makePro({
        user_id: "pro-far-pending",
        lat: 6.5244 + 0.025,
        lng: 3.3792,
        docs_status: "under_review",
      }),
      makePro({
        user_id: "pro-far-rejected",
        lat: 6.5244 + 0.025,
        lng: 3.3792,
        docs_status: "rejected",
      }),
      makePro({
        user_id: "pro-far-approved",
        lat: 6.5244 + 0.025,
        lng: 3.3792,
        docs_status: "approved",
      }),
    ];

    const profiles = [
      makeProfile("pro-close-pending"),
      makeProfile("pro-far-pending"),
      makeProfile("pro-far-rejected"),
      makeProfile("pro-far-approved"),
    ];

    mockSupabase(pros, profiles);

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    const techIds = json.data.technicians.map((t: { id: string }) => t.id);

    // pro-close-pending (~1.3 km) <= 2 km -> included
    expect(techIds).toContain("pro-close-pending");
    // pro-far-pending (~2.8 km) > 2 km -> excluded
    expect(techIds).not.toContain("pro-far-pending");
    // pro-far-rejected (~2.8 km) > 2 km -> excluded
    expect(techIds).not.toContain("pro-far-rejected");
    // pro-far-approved (~2.8 km) <= 5.75 km -> included
    expect(techIds).toContain("pro-far-approved");

    // Check meta
    expect(json.data.meta.maxRadiusKm).toBe(5);
    expect(json.data.meta.docsPendingRadiusKm).toBe(2);
  });

  it("handles empty list or no matching pros gracefully", async () => {
    mockSupabase([], []);

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.technicians).toEqual([]);
    expect(json.data.count).toBe(0);
  });

  it("fails with 503 when supabase is not configured", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    const res = await GET(req());
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.error.code).toBe("supabase_not_configured");
  });
});

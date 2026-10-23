import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth-utils", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import { GET, PATCH } from "../route";

const getUserFromRequestMock = vi.mocked(getUserFromRequest);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

describe("/api/notifications/settings Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getUserFromRequestMock.mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/notifications/settings");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns existing notification preferences on GET", async () => {
    getUserFromRequestMock.mockResolvedValueOnce({ id: "user-abc" } as never);

    const prefs = {
      enabled: true,
      categories: { requests: true, promotional: false },
      delivery: { push: true, inApp: true },
    };

    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { notification_preferences: prefs },
              error: null,
            })),
          })),
        })),
      })),
    } as never);

    const req = new Request("http://localhost/api/notifications/settings");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual(prefs);
  });

  it("updates preferences on PATCH and deep merges categories and delivery", async () => {
    getUserFromRequestMock.mockResolvedValueOnce({ id: "user-abc" } as never);

    let updatedPreferences: Record<string, unknown> | null = null;

    createServiceSupabaseMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                notification_preferences: {
                  enabled: true,
                  categories: { requests: true, promotional: false },
                  delivery: { push: true, inApp: true },
                },
              },
            })),
          })),
        })),
        update: vi.fn((updatePayload: { notification_preferences: Record<string, unknown> }) => {
          updatedPreferences = updatePayload.notification_preferences;
          return {
            eq: vi.fn(async () => ({ error: null })),
          };
        }),
      })),
    } as never);

    const payload = {
      enabled: false,
      categories: { promotional: true },
      delivery: { push: false },
    };

    const req = new Request("http://localhost/api/notifications/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.saved).toBe(true);
    expect(updatedPreferences).toBeDefined();
    expect((updatedPreferences as unknown as { enabled: boolean }).enabled).toBe(false);
    expect((updatedPreferences as unknown as { categories: { requests: boolean; promotional: boolean } }).categories.requests).toBe(true);
    expect((updatedPreferences as unknown as { categories: { requests: boolean; promotional: boolean } }).categories.promotional).toBe(true);
    expect((updatedPreferences as unknown as { delivery: { push: boolean; inApp: boolean } }).delivery.push).toBe(false);
    expect((updatedPreferences as unknown as { delivery: { push: boolean; inApp: boolean } }).delivery.inApp).toBe(true);
  });
});

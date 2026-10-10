import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro } from "./scripted-db";
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: vi.fn(() => true) }));
import { createServiceSupabase } from "@/lib/supabase/server";
import { loadOrRepairLoginProfile } from "../login-profile";

beforeEach(() => { vi.clearAllMocks(); });

describe("login profile persistence failure semantics", () => {
  it("keeps returned data even when shared and side reads carry errors", async () => {
    const sb = scriptedDb({ profiles: [{ data: sharedProfile, error: { message: "partial" } }], motorist_profiles: [{ data: motorist, error: { message: "partial" } }], repair_pro_profiles: [{ data: pro, error: { message: "partial" } }] });
    vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
    const result = await loadOrRepairLoginProfile("user-1", "ada@example.com", {});
    expect(result).toMatchObject({ hasMotorist: true, hasPro: true, profile: { bankName: "Pro Bank" } });
    expect(sb.calls[2].steps[0].args).toEqual(["user_id, business_name, primary_service, services, years_experience, bio, service_radius_km, nin_verified, bvn_verified, docs_status, docs_rating_boost_applied, certification_file_name, certification_file_url, skills, rating_avg, jobs_completed, labour_prices, pricing_currency, vehicle_focus, created_at, bank_name, bank_account_name, bank_account_number, bank_code"]);
  });

  it("treats side read errors without data as missing roles rather than throwing", async () => {
    const sb = scriptedDb({ profiles: [{ data: { ...sharedProfile, role: "repair_pro" } }], motorist_profiles: [{ data: null, error: { message: "unavailable" } }], repair_pro_profiles: [{ data: null, error: { message: "unavailable" } }] });
    vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
    expect(await loadOrRepairLoginProfile("user-1", "ada@example.com", {})).toMatchObject({ hasMotorist: false, hasPro: true, profile: { accountType: "professional", docsStatus: "approved", services: [] } });
  });

  it("propagates thrown initial read failures to the route's outer handler", async () => {
    const sb = scriptedDb({ profiles: [new Error("read unavailable")] });
    vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
    await expect(loadOrRepairLoginProfile("user-1", "ada@example.com", {})).rejects.toThrow("read unavailable");
  });

  it("defaults repaired metadata to customer role, email name and null phone", async () => {
    const sb = scriptedDb({ profiles: [{ data: null }, { data: sharedProfile }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: null }] });
    vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
    await loadOrRepairLoginProfile("user-1", "ADA@example.com", undefined);
    expect(sb.calls[1].steps[0].args[0]).toMatchObject({ role: "motorist", full_name: "ADA", phone: null, email: "ada@example.com" });
  });

  it("preserves login's explicit-false inactive check for legacy null flags", async () => {
    const sb = scriptedDb({ profiles: [{ data: { ...sharedProfile, is_active: null } }], motorist_profiles: [{ data: motorist }], repair_pro_profiles: [{ data: null }] });
    vi.mocked(createServiceSupabase).mockReturnValue(sb as never);
    expect(await loadOrRepairLoginProfile("user-1", "ada@example.com", {})).toHaveProperty("profile");
  });
});

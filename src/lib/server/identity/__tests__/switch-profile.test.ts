import { beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedDb, sharedProfile, motorist, pro } from "./scripted-db";
vi.mock("@/lib/server/identity/identity-sync", () => ({ listUserRoles: vi.fn(async () => []) }));
import { loadSwitchedIdentityProfile } from "../switch-profile";
import { listUserRoles } from "../identity-sync";
import type { ProfileRow } from "@/lib/supabase/types";

beforeEach(() => { vi.clearAllMocks(); });
const profile = { ...sharedProfile, role: "repair_pro" } as ProfileRow;

describe("switched identity projection failure semantics", () => {
  it("keeps missing/error role reads as defaults and uses active-role primary fallback", async () => {
    const failed = { data: null, error: { message: "read unavailable" } };
    const sb = scriptedDb({ motorist_profiles: [failed, failed], repair_pro_profiles: [failed, failed] });
    const result = await loadSwitchedIdentityProfile(sb as never, "user-1", "repair_pro", profile);
    expect(result).toMatchObject({ hasMotorist: false, hasPro: false, primaryAccountType: "professional", userProfile: { services: ["mechanic"], govIdVerified: false, phoneVerified: false } });
    expect(sb.calls.map(c => c.steps[0].args)).toEqual([["*"], ["*"], ["user_id, created_at"], ["user_id, created_at"]]);
    expect(sb.calls.every(c => c.steps[1].args[1] === "user-1")).toBe(true);
  });

  it("preserves empty services arrays rather than replacing them with fallback", async () => {
    const sb = scriptedDb({ motorist_profiles: [{ data: motorist }, { data: motorist }], repair_pro_profiles: [{ data: { ...pro, services: [] } }, { data: pro }] });
    const result = await loadSwitchedIdentityProfile(sb as never, "user-1", "repair_pro", profile);
    expect(result.userProfile.services).toEqual([]);
  });

  it("falls back to customer bank while preserving shared phone and stored primary role", async () => {
    const sb = scriptedDb({ motorist_profiles: [{ data: { ...motorist, phone_verified: false } }, { data: motorist }], repair_pro_profiles: [{ data: { ...pro, bank_name: null, bank_account_number: null } }, { data: pro }] });
    const result = await loadSwitchedIdentityProfile(sb as never, "user-1", "repair_pro", { ...profile, primary_role: "repair_pro", phone_verified: true } as ProfileRow);
    expect(result).toMatchObject({ primaryAccountType: "professional", userProfile: { phoneVerified: true, bankName: "Customer Bank", bankAccountNumber: "0000000001" } });
  });

  it("propagates thrown projection reads without reading the role registry", async () => {
    const sb = scriptedDb({ repair_pro_profiles: [new Error("read failed")] });
    await expect(loadSwitchedIdentityProfile(sb as never, "user-1", "repair_pro", profile)).rejects.toThrow("read failed");
    expect(listUserRoles).not.toHaveBeenCalled();
  });
});

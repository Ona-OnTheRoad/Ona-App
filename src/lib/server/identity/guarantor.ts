import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { UserProfile } from "@/lib/types";

export const GUARANTOR_COLUMNS =
  "full_name, phone, address, occupation, relationship, linked_user_id" as const;

export const guarantorInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  address: z.string().trim().max(240).optional(),
  occupation: z.string().trim().max(120).optional(),
  relationship: z.string().trim().min(2).max(80),
});

export const partialGuarantorInputSchema = guarantorInputSchema.extend({
  relationship: z.string().trim().min(2).max(80).optional(),
});

export type GuarantorInput = z.infer<typeof guarantorInputSchema>;
export type PartialGuarantorInput = z.infer<typeof partialGuarantorInputSchema>;

type RawGuarantor = {
  full_name?: string | null;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  relationship?: string | null;
  linked_user_id?: string | null;
  linkedUserId?: string | null;
};

/**
 * Normalize guarantor data from either `repair_pro_guarantors` (snake_case)
 * or `repair_pro_profiles.guarantor` JSONB (camelCase / snake_case).
 */
export function normalizeGuarantor(
  raw: unknown,
): UserProfile["guarantor"] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const g = raw as RawGuarantor;
  const fullName = String(g.full_name ?? g.fullName ?? "").trim();
  const phone = String(g.phone ?? "").trim();
  if (!fullName && !phone) return undefined;
  const address = String(g.address ?? "").trim() || undefined;
  const occupation = String(g.occupation ?? "").trim() || undefined;
  const relationshipRaw = String(g.relationship ?? "").trim();
  const relationship = relationshipRaw || "";
  const linkedUserId =
    String(g.linked_user_id ?? g.linkedUserId ?? "").trim() || undefined;
  return {
    fullName,
    phone,
    address,
    occupation,
    relationship,
    linkedUserId,
  };
}

/**
 * Persist a Service Pro's guarantor to both `repair_pro_guarantors` and
 * `repair_pro_profiles.guarantor` JSONB, checking Supabase `{ error }` on every write.
 */
export async function persistGuarantor(
  admin: SupabaseClient,
  userId: string,
  input: PartialGuarantorInput,
  opts?: { mergeExisting?: boolean; skipJsonbWrite?: boolean },
): Promise<
  | { ok: true; guarantor: NonNullable<UserProfile["guarantor"]> }
  | { ok: false; error: string }
> {
  let existing: UserProfile["guarantor"] | undefined;
  if (opts?.mergeExisting) {
    try {
      const [tableRes, proRes] = await Promise.all([
        admin
          .from("repair_pro_guarantors")
          .select(GUARANTOR_COLUMNS)
          .eq("user_id", userId)
          .maybeSingle(),
        admin
          .from("repair_pro_profiles")
          .select("guarantor")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      existing =
        normalizeGuarantor(tableRes.data) ??
        normalizeGuarantor(
          (proRes.data as { guarantor?: unknown } | null)?.guarantor,
        );
    } catch {
      existing = undefined;
    }
  }

  const incomingRel = input.relationship?.trim();
  const relationship =
    incomingRel &&
    !(opts?.mergeExisting && incomingRel === "Guarantor" && existing?.relationship)
      ? incomingRel
      : existing?.relationship || incomingRel || "Guarantor";

  const merged: NonNullable<UserProfile["guarantor"]> = {
    fullName: input.fullName.trim() || existing?.fullName || "",
    phone: input.phone.trim() || existing?.phone || "",
    address:
      input.address?.trim() ||
      (opts?.mergeExisting ? existing?.address : undefined) ||
      undefined,
    occupation:
      input.occupation?.trim() ||
      (opts?.mergeExisting ? existing?.occupation : undefined) ||
      undefined,
    relationship,
    ...(existing?.linkedUserId ? { linkedUserId: existing.linkedUserId } : {}),
  };

  const { error: tableErr } = await admin.from("repair_pro_guarantors").upsert(
    {
      user_id: userId,
      full_name: merged.fullName,
      phone: merged.phone,
      address: merged.address ?? null,
      occupation: merged.occupation ?? null,
      relationship: merged.relationship,
    },
    { onConflict: "user_id" },
  );
  if (tableErr) {
    console.error("persistGuarantor table upsert failed:", tableErr.message);
    return { ok: false, error: tableErr.message };
  }

  if (!opts?.skipJsonbWrite) {
    const { error: jsonErr } = await admin
      .from("repair_pro_profiles")
      .update({
        guarantor: {
          fullName: merged.fullName,
          phone: merged.phone,
          address: merged.address ?? null,
          occupation: merged.occupation ?? null,
          relationship: merged.relationship,
        },
      })
      .eq("user_id", userId);
    if (jsonErr) {
      console.error(
        "persistGuarantor profile JSONB update failed:",
        jsonErr.message,
      );
      return { ok: false, error: jsonErr.message };
    }
  }

  return { ok: true, guarantor: merged };
}

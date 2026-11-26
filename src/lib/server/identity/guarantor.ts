import "server-only";
import type { UserProfile } from "@/lib/types";

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
  const relationship = String(g.relationship ?? "").trim();
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

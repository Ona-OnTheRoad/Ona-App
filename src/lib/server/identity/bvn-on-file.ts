import "server-only";

type BvnFields = {
  bvn_encrypted?: string | null;
  bvn_last4?: string | null;
  bank_id_number?: string | null;
  gov_id_meta?: unknown;
};

/**
 * True when a BVN was actually submitted. Tier 2 approval is about the
 * government ID; `bvn_verified` (which unlocks Tier 3) may only be set by an
 * approval when there is a BVN on file to vouch for.
 */
export function bvnOnFile(row: BvnFields | null | undefined): boolean {
  if (!row) return false;
  const meta =
    row.gov_id_meta &&
    typeof row.gov_id_meta === "object" &&
    !Array.isArray(row.gov_id_meta)
      ? (row.gov_id_meta as Record<string, unknown>)
      : {};
  return Boolean(
    row.bvn_encrypted ||
      row.bvn_last4 ||
      row.bank_id_number ||
      meta.bankId ||
      meta.bvn,
  );
}

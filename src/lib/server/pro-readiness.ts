import "server-only";

type ProReadinessRow = {
  status?: string | null;
  gov_id_review_status?: string | null;
  verified?: boolean | null;
  nin_verified?: boolean | null;
  visibility_tier?: number | string | null;
  is_online?: boolean | null;
};

/**
 * The customer feed's rule for "this pro may be listed". Approved/verified pros
 * are marketplace-ready (T2+) even when a stale write left visibility_tier=1.
 */
export function isProMarketplaceReady(p: ProReadinessRow): boolean {
  const rawTier = Number(p.visibility_tier);
  return (
    (Number.isFinite(rawTier) && rawTier >= 2) ||
    p.gov_id_review_status === "approved" ||
    Boolean(p.verified) ||
    p.status === "approved"
  );
}

/**
 * May this pro fetch and poll jobs? It must be a superset of everyone the
 * dispatcher or the customer feed can reach, otherwise a pro who customers can
 * see would never be shown the request: anyone marketplace-ready or online (the
 * dispatcher only needs online + not suspended/rejected), unless suspended or
 * rejected.
 */
export function isProJobsEligible(p: ProReadinessRow | null | undefined): boolean {
  if (!p) return false;
  if (p.status === "suspended" || p.status === "rejected") return false;
  return (
    isProMarketplaceReady(p) || Boolean(p.is_online) || Boolean(p.nin_verified)
  );
}

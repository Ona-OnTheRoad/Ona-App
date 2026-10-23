"use client";

import { VerificationScreen } from "@/components/verify/verification-screen";

/**
 * Customer verification hub:
 * Tier 1: Phone number (30-day trial)
 * Tier 2: Government ID (NIN) -> /verify/tier-2
 * Tier 2 Approved celebration view
 */
export default function VerifyIdentityPage() {
  return <VerificationScreen />;
}

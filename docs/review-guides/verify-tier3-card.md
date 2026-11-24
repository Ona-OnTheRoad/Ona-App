# Verify hub: Tier 3 liveness card

## Goal

On `/verify`, the Repair Pro Tier 3 card showed "Locked" even after Care approved Tier 2. It never showed "Verified" because it read a field that does not exist (`livenessVerified` instead of `faceLivenessVerified`). Clicking it opened `/settings/security`, the change-password screen. Reported 2026-11-23 for a Pro on dev with Tier 2 approved and no liveness yet. The user approved the fix described in the conversation.

## Expected change areas

- `src/components/verify/tier3-liveness-card.tsx`: the badge shows Verified, Start (unlocked) or Locked. Clicks are ignored when locked or already verified.
- `src/components/verify/verification-screen.tsx`: reads `faceLivenessVerified` and routes to `/verify/tier-3`.
- New `src/app/(onboarding)/verify/tier-3/page.tsx` and `src/components/verify/tier3-liveness-screen.tsx`. They run `FaceLiveness` with `serverVerify`, so the server check from `liveness-server-authority` is used. The screen gates on a Pro account and Care-approved Tier 2, and notes when the BVN is still missing.
- Protected fee/job/payout files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Check each item in [`verify-tier3-card.json`](verify-tier3-card.json) against the reviewed commit. Code and test evidence is kept apart from hosted evidence. Never mark an unrun check passed.

## Boundaries and limitations

- Unlocking still uses the cached client profile (`isIdentityVerified`). A stale cache keeps the card locked until the profile refreshes.
- The pass is authoritative on the server only. The screen's `updateUserProfile` call just mirrors it locally.
- BVN entry is not added here; the screen only mentions it.

## Remaining work

- **Code:** none found beyond independent review.
- **External:** a browser check on dev with a Tier 2 approved Pro (H1).

## Closeout

Not closed. Update `docs/BACKEND_FIXES_STATUS.md` when this merges.

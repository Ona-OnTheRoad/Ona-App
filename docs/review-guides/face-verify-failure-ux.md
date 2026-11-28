# Face verify failure UX (Tier 3)

## Goal

Pros who fail Tier 3 face verification should see an honest reason class (NIN mismatch vs capture quality vs outage), not a generic “use good light” tip for every Prembly rejection. Care/audit should retain a safe failure class and confidence. Selfie capture should meet Prembly’s recommended face-region size more often. Agreed plan: Phase 1 from the 2026-11-28 face-verify inspection (Phase 0 ops diagnosis deferred; no Pro details available).

## Expected change areas

- `src/lib/server/identity/liveness/face-check.ts` — nested `face_data` parsing, confidence normalisation, failure reason class.
- `src/app/api/liveness/verify/route.ts` — user-facing copy by reason; audit fields (`reason`, `confidence`) without NIN/image.
- `src/components/profile/face-liveness/submit-selfie.ts` — higher capture resolution/JPEG quality.
- `src/components/profile/face-liveness/use-liveness-boot.ts` and `retry-session.ts` — higher camera ideal resolution.
- Tests under `face-check` and `liveness/verify`.
- Protected fee/job/timer/payout files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Inspect each requirement in [`face-verify-failure-ux.json`](face-verify-failure-ux.json) against the exact reviewed commit. Separate code/test evidence from hosted Prembly/camera evidence. Never mark an unrun check passed.

## Boundaries and limitations

- Does not confirm the live Prembly tenant path/response (still open on `liveness-server-authority`).
- Does not lower `PREMBLY_FACE_MIN_CONFIDENCE` without score evidence.
- Does not switch default mode to image-only `liveness`.
- Does not add Care UI for evidence (still remaining on server-authority guide).
- Browser challenge remains a UX gate only; authority stays with the server provider check.

## Remaining work

See the paired JSON `remainingWork`. In summary:

- **Code:** independent review after implementation.
- **External:** Phase 0 diagnosis when a Pro id is available; live Prembly face smoke; phone camera smoke; production migration 088 if still pending.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` when this lands. Keep Phase 0 / hosted checks pending until run.

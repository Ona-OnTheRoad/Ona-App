# Liveness server authority (Tier 3)

## Goal

Only a verified provider result, obtained by the server, can mark a Repair Pro `face_liveness_verified`. Before this change, any signed-in client could set Tier 3 itself through three routes: `POST /api/liveness/verify` with `passed: true`, `POST /api/profile/update` with `faceLivenessVerified`, and `PATCH /api/artisan/profile` with `livenessPassedAt`. Each of these widened search reach through `recomputeProVisibility`.

The agreed plan ("Liveness trust risks and server mitigation plan", risks R1–R7) was approved on 2026-11-23, with these decisions:

- **Legacy Tier 3 rows are grandfathered and flagged, not cleared** (user decision, 2026-11-23). Migration 088 tags every row that has a liveness flag but no server evidence with `liveness_meta.source = 'legacy_self_attested'`. Those rows **keep** their marketplace reach until Care clears them. This replaces the plan's draft criterion "existing self-attested T3 does not retain verified reach", and risk R7 stays open as an operational item.
- **Provider product.** The user did not choose one, so the default is Prembly NIN + face (`/verification/nin_w_face`): the selfie is checked against the NIN already on file. `PREMBLY_FACE_MODE=liveness` switches to the image-only liveness check. The request path can be overridden with `PREMBLY_FACE_PATH`, because the exact path on this tenant has not been confirmed.
- **Evidence storage.** The selfie is stored as a `data:` URL in `face_liveness_selfie_url`, the same way gov ID images are stored, and Care's existing `/api/admin/docs?kind=selfie` viewer already reads that column. Provider evidence goes in a new server-only column, `liveness_meta`, not `gov_id_meta`, because `/api/artisan/profile` accepts client-written `govIdMeta`.

## Expected change areas

- `src/app/api/liveness/verify/route.ts`: new contract `{ selfie, challenges?, durationMs? }`, with rate limit, provider call and evidence write.
- `src/lib/server/identity/liveness/`: Prembly face client, selfie validation, NIN on file, evidence record, rate-limit guard.
- `src/app/api/profile/update/route.ts`: `faceLivenessVerified` removed from the schema and the write.
- `src/app/api/artisan/profile/route.ts`: `livenessPassedAt` removed from the schema and the write.
- `supabase/migrations/20261123_088_liveness_server_authority.sql`: adds the `liveness_meta` column and flags legacy rows.
- Client: `src/components/profile/face-liveness/` (captures a selfie frame and waits for the server verdict before success), `src/components/artisan/artisan-onboarding/liveness-tier.tsx` and `src/lib/store/use-update-profile.ts` (stop sending liveness flags).
- Protected fee/job/timer/payout files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Inspect each requirement in [`liveness-server-authority.json`](liveness-server-authority.json) against the exact reviewed commit. Code and test evidence is recorded separately from hosted evidence (a live Prembly call, the migration applied on dev or production). Never mark an unrun check passed.

## Boundaries and limitations

- The browser challenge (MediaPipe blink/turn) is still client-side. It is now a UX gate only. Authority comes from the provider's verdict on the captured frame. A scripted caller can still submit a photo, so the strength of Tier 3 is the strength of the Prembly product used. In NIN + face mode a photo of someone else fails; a photo of the real NIN holder may pass. Only provider-side liveness addresses that.
- The Prembly request and response shapes for face products come from public docs and have not been checked against this tenant. The success rule is: the body passes `isSuccessBody`, `face_data.status` is not `false`, and any confidence value meets `PREMBLY_FACE_MIN_CONFIDENCE` (default 80). A hosted check is pending.
- Grandfathered rows keep Tier 3 reach (see the user decision above).
- Out of scope, found during the work: `PATCH /api/artisan/profile` lets the client overwrite `gov_id_meta`, which holds the server's `idLookup` evidence. This needs a separate fix.

## Remaining work

See the `remainingWork` section of the JSON guide. In summary:

- **Code:** independent review; Care UI to show the selfie, `liveness_meta` and the legacy flag and to clear Tier 3 (plan Phase C); a fix for `govIdMeta` on the artisan profile; periodic re-liveness (ONA-ID-305).
- **External:** apply migration 088 on production (dev project `halsdbcilmskdanrckvn` applied 2026-11-23); confirm the Prembly face endpoint and response on the tenant; set `PREMBLY_FACE_MODE` if needed; Care review of the grandfathered rows; camera smoke test in a browser.

## Closeout

Not closed. Update `docs/BACKEND_FIXES_STATUS.md` when this merges, with the same remaining code and external work.

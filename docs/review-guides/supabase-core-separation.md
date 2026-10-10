# Supabase core separation (Scope 2) — review guide

## Goal

Separate Ona's core business logic from Supabase while keeping Supabase as the running backend — Scope 2 of the Supabase Decoupling Assessment (6–10 engineer-weeks). Business services stop depending directly on Supabase clients and tables; database, identity, storage and event access move behind defined interfaces. Agreed plan: `reports/Ona-Supabase-Decoupling-Assessment.html` and `reports/Ona-Scope-2-Core-Separation.html`. Full function-level inventory and proposed exit criteria: `reports/Ona-Scope-2-Stage-1-Review-Guide.html`.

## Expected change areas

`src/lib/supabase/app-api.ts` — 9 of 27 `backend*` functions: `backendDualRoleFlags`, `backendLoadUserProfile`, `backendFetchPros`, `backendSetProOnline`, `backendGetProOnline`, `backendFetchJobsForUser`, `backendEnsureConversation`, `backendFetchConversations`, `backendSendMessage`.

`src/lib/supabase/session.ts` — consolidate remaining ad hoc `sb.auth.getSession()` reads (`backendGetSessionUserId`, `backendLogout`) onto the existing `ensureAppSession()` helper.

`src/lib/server/{jobs,payments,pairing,shop,identity}` — formalize defined interfaces over the domain folders that already exist; business services stop importing Supabase SDK types/clients directly.

`src/components/notifications/settings/use-notification-settings.ts` and `src/app/api/notifications/settings/route.ts` — fix the nested (`categories`/`delivery`/`quietHours`) vs. flat (`pushEnabled`/`jobAlerts`) field mismatch as part of this work.

Realtime consumers (`notification-provider.tsx`, `use-call-inbox.ts`, `use-typing-channel.ts`) get an interface wrapper, not removal.

**Explicitly unchanged:** auth-SDK sign-in/sign-out calls (`backendSignIn`, `backendSignUp`, `backendSignOut`, OTP flows), Supabase Realtime subscriptions, protected fees, assignment rules, timers, and existing database concurrency guarantees (payment confirmation, job versioning, worker leases, stock reservations).

## Reviewer procedure

Inspect each requirement in the paired JSON guide against the exact reviewed commit. For each of the 9 in-scope functions, confirm the direct Supabase call or fallback path is gone and that the replacement route preserves existing visibility/ownership rules. Record code evidence (tests, diff review, import audits) separately from hosted evidence (RLS/grant verification, realtime authorization check, production smoke test). Never mark an unrun check passed.

## Boundaries and limitations

Excludes replacing Supabase, Postgres, Auth, Storage or Realtime with another provider, and excludes migrating user identities or credentials — that is the separate 12–20+ engineer-week scope. Does not change protected fees, assignment rules or timers. No database schema, RLS policy or production grant change happens until the stage that specifically calls for it (see the six-stage sequence in `reports/Ona-Scope-2-Core-Separation.html`). Effort estimates are unverified against hosted permissions and production traffic.

## Remaining work

Code: Stage 2 is complete and committed (`facb735`): `backendSetProOnline`'s direct-write fallback is removed; `backendSendMessage` now calls a new `/api/messages/send` route with an explicit conversation-membership check and a documented partial-failure policy (message insert is authoritative; conversation-timestamp update and notify are best-effort and logged on failure, not silently swallowed); `backendFetchPros`'s direct-query fallback (`repair_pro_profiles`/`profiles` reads) is removed — it now only calls `/api/pros` and returns `[]` on any failure, since that route already applies the same tier/suspension/synthetic-account filtering and dual-role self-exclusion the fallback duplicated.

Stage 3 is in progress: `backendGetProOnline`'s direct `repair_pro_profiles` read is replaced by a new `GET /api/pros/live` route (commit `3f06d8a`); `backendDualRoleFlags`'s direct `motorist_profiles`/`repair_pro_profiles` reads are replaced by a new `GET /api/account/role-flags` route. Both derive the caller from `requireUser(req)`, never a client-supplied id. Remaining in Stage 3: `backendLoadUserProfile`, `backendFetchJobsForUser`, `backendEnsureConversation`, `backendFetchConversations`. Remaining after that: Stages 4–6 (domain interface extraction, auth/realtime/storage isolation, rollout), and the notification-settings contract fix. Independent review against the Stage 2 commit is pending; the rest of Stage 3 is not yet committed.

**Known defect surfaced by this refactor (tracked separately, not fixed inline):** the deleted `backendFetchPros` fallback was the only path enforcing `DOCS_PENDING_MAX_RADIUS_KM` (2 km) for pros with pending/rejected docs — `/api/pros` (`src/app/api/pros/route.ts:231-241`) applies a flat 5.75 km radius to every pro regardless of docs status and only reports the 2 km figure in response metadata, it never filters on it. This predates Stage 2; removing the fallback just makes the gap the standing behavior instead of an intermittent one (the fallback only ran when `/api/pros` itself failed). Per stakeholder decision, fixing `/api/pros`'s distance filter is tracked as separate remaining work, not bundled into this fallback-removal change. See `docs-pending-radius-cap-enforced` in the JSON guide.

External: none yet identified. Database grant/RLS changes will be scoped once the in-scope functions are moved (Stage 2–4) and verified against hosted policy before any revocation.

## Closeout

This effort is not part of `docs/BACKEND_FIXES_STATUS.md`'s numbered issue ledger — that file tracks the backend engineer review's "Suggested order of work" (a different pair of reports). This guide tracks the separate Supabase Decoupling Assessment and is not added there unless the two efforts are explicitly folded together.

Reviewed commit: pending (Stage 2 committed as `facb735`; Stage 3's pros/live move committed as `3f06d8a`; the rest of Stage 3 in progress, uncommitted, on branch `codex/supabase-core-separation-stage-2`). Stage 1 exit (scope and criteria agreed) was approved by the stakeholder on 2026-10-10. Stage 3 is in progress (5 of 9 in-scope functions moved); full local test suite (1,240 tests / 109 files), typecheck and lint pass against the current working tree.

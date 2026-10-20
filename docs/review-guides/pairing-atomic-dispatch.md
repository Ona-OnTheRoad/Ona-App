# Atomic pairing dispatch and version-conflict recovery

## Goal

A nearby eligible pro must either be atomically offered and assigned to a job, or leave neither write behind. Fix the queue-first/CAS race identified in the 2026-10-18 investigation. User requested implementation; baseline `5bf2dfb`.

## Agreed implementation plan

1. Characterize a concurrent classification update with a failing dispatch regression before implementation.
2. Add a service-role-only transactional dispatch RPC: lock the job, check expected version/state, then write the offered queue row and matching assignment together. Keep timestamps/history, null until surfaced deadline, candidate ranking and notification timing.
3. On version conflict, reload and rerun candidate selection with a bounded retry. Preserve cancellation, confirmed/assigned state, existing offers and terminal queue exclusions. Exhausted contention returns an explicit retryable conflict, not success.
4. Exercise concurrency, rollback, state guards, permissions, missing RPC and retry bounds. Run pairing/full regressions, typecheck, lint and diff checks. Track migration/database rollout separately.

## Expected change areas

Pairing engine dispatch orchestration, a small server-only dispatch module if useful, migration 081, focused Vitest tests, disposable PostgreSQL fixture and migration-CI permission assertions. No change to protected fees, job-store, 144-second response window, six-pro cap, radius policy or classification logic. The separate local polling pause was saved and lifted only after the user explicitly authorized the full flow test; it is not part of the pairing production diff.

## Reviewer procedure

Use the paired JSON checklist against the resulting diff/commit. Compare job/queue state after injected conflicts and failures; verify SQL effects with a disposable local PostgreSQL database rather than only a scripted client. Record local code/SQL evidence separately from configured/hosted migration and browser smoke. Independent human review stays pending.

## Boundaries and limitations

No existing orphan-queue repair, approval changes, UI/count changes, notification outbox, frontend three-minute cancellation or automatic sweep-migration rollout. Sweep migration 078 was initially missing and was applied with user authorization on 2026-10-19 (see configured-database evidence below). Notification delivery remains best-effort after the transaction. No global guarantees are claimed for other nontransactional pairing transitions or customer-chosen-pro creation.

## Remaining work

Code: implementation and local checks complete; independent human review and full-history Supabase migration replay pending. The existing CI permission assertion now includes the new RPC.
External: configured-database migrations 078/081, restoring local updates and localhost two-session authenticated API/realtime smoke completed with user authorization. Browser-rendered visual smoke, deployed-host verification and unattended overdue recovery remain pending.

## Closeout

Reviewed commit pending. This focused follow-up does not close broader Issue 4/5 or deployment criteria. Update the status ledger with this work and its residuals, without replacing prior issue evidence.

## Local implementation evidence (2026-10-19)

Seven new orchestration regressions cover classification conflict recovery, changed-trade reselection, bounded contention, existing assignments, missing RPC, cancellation/negotiation winners and post-commit-only notification. The initial five cases failed against baseline before production changes. Existing pairing harness models RPC effects; the new PostgreSQL fixture independently checks actual transactional behavior.

All 1,476 tests / 139 files pass; typecheck passes; lint has 0 errors / 144 existing warnings, none in changed files; diff check passes. The real PostgreSQL 16 fixture passes concurrent/duplicate offers, blocked classification/cancel/negotiation races, assignment failure rollback/retry, FK failure, terminal/contacted queue exclusions, six-pro cap, migration reapplication and role permissions. New modules/scripts stay below 300 lines; engine shrinks. No fee/window/radius constants were changed.

## Rollout order and remaining limitations

Verify version trigger migration 079, then apply 081 before deploying this caller. Missing RPC fails closed at the dispatch operation; initial job creation's existing best-effort wrapper still does not surface every dispatch failure to the customer, so migration preflight and hosted monitoring remain necessary. This fix does not change that creation response contract. Check/apply the separate missing 078 sweep prerequisites to recover overdue requests. The configured-database migrations and labelled test requests were subsequently authorized and executed; see the evidence below. No existing orphan repair was performed.

The implementation and the eight original local polling-pause files are now together in `/Users/mac/VSCodeProjects/Ona-App` on `codex/pairing-atomic-dispatch`, at the user’s request. The polling pause was subsequently saved and lifted with user authorization for the smoke test. Use a new request; existing cancelled/orphan queue records are not repaired. The separate frontend three-minute auto-cancel remains.

Disposable fixture command: `PAIRING_TEST_DATABASE_URL=postgresql://<user>@127.0.0.1:<port>/<fresh_database> node scripts/verify-pairing-dispatch.mjs`. It refuses remote hosts or databases containing service_requests and never reads application environment files. This checks the new migration against a focused schema fixture, not full hosted RLS/schema behavior.

## Configured database and authenticated smoke (2026-10-19)

User authorized all setup/test steps. Verified the 079 version trigger, applied migrations 078 and 081 through configured DATABASE_URL, and reloaded the REST schema. Verified sweep/timeout/dispatch RPCs and least-privilege dispatch execute permissions. These were actual configured-database SQL applications, not a Supabase CLI full-history replay or a deployed-host release.

Saved the exact eight-file debug pause at `/private/tmp/ona-pairing-polling-pause.saved.patch` and restored normal committed polling/realtime behavior; no pause changes were committed. The app remains on the pairing branch in the main project checkout.

Two independent demo-OTP-authenticated HTTP sessions exercised localhost:3000. The final new request had one matching queue offer and assignment, appeared in the pro lean incoming list, reached reserved, and CONFIRM advanced it to negotiating. Customer GET and its realtime subscription both observed negotiation; customer received six events and pro four. The existing pro app automatically surfaced/opened cards, producing normal 409 races in the first two test attempts; the final smoke reconciled current state before continuing. All three labelled unpaid requests were cancelled through the API and cancellation was verified by a final database read.

Authenticated pairing-sweep returned HTTP 200 with zero overdue rows; zero leases remained afterward. This establishes sweep availability/release, not unattended deadline recovery. Browser automation was not connected, so no direct visual/click inspection is claimed. Full-history migration CI, independent human review, browser visual smoke, deployed-host and unattended overdue recovery remain pending. Redacted operational evidence is saved at `/private/tmp/ona-pairing-live-evidence.json`; no tokens/passwords were written there.

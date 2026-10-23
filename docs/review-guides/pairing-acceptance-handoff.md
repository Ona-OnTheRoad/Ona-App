# Pairing Open and acceptance handoff

## Goal

Fix the observed Open CAS loss (`open_race`) followed by an optimistic labour form while the persisted job never entered negotiation. User approved the proposed fix on 2026-10-19. Work stays in the main checkout on codex/pairing-atomic-dispatch alongside the prior atomic-dispatch fix.

## Approved plan

1. Add failing frontend and server regressions for pending/failed automatic Open, shared tap opening, confirmation failures, and idempotent reopening.
2. Add migration 082 with a service-role-only Open transaction that reads the locked current job, writes the matching reservation and review state together, and safely replays an already-open request without rearming its timer. Classification/surface version changes must not strand the reservation. Preserve authorization and cancellation/assignment winners.
3. Replace the attempted boolean with a shared in-flight Open promise. A failed resolved API result must release it for retry; the tap must await any automatic Open before Confirm.
4. Keep the incoming card/loading/error visible until successful server confirmation. Seed/navigate only using the returned negotiating job. Gate labour offers/accept actions on real negotiation readiness. Preserve 144s pairing, 20min negotiation, six-offer limit, prices and existing panel geometry.
5. Verify real PostgreSQL locks/rollback/permissions and full local gates. Apply 082 and test the real frontend hook plus authenticated new request -> confirm -> first labour offer. Record actual database/UI/hosted evidence separately.

## Expected change areas

Pairing Open helper/orchestration, migration 082, existing/new pairing regressions and disposable SQL fixture, incoming state/queue/fix-it hooks, shared Open helper, negotiation footer readiness and tests, migration-CI permissions, these guides and status ledger. Protected pricing/constants/job-store remain unchanged.

## Reviewer procedure

Check paired criteria against the diff. Delay automatic Open, resolve it with ok:false, retry on tap, delay/fail Confirm, and verify no navigation or offer form before success. Check SQL contention, duplicate opens, cancellation/ownership guards, rollback and timer preservation. Independently review before merge; unrun browser/full-replay checks stay pending.

## Boundaries and limitations

No revival of expired request 4c581ec2; test on a new request. Existing atomic dispatch 081 remains a prerequisite already applied. No payment execution, fee/window/radius changes or panel redesign. Broader Confirm/decline nontransactional side effects remain separately tracked; this step makes Open atomic and gates the frontend on actual Confirm success. No claim of unattended or deployed-host coverage.

## Remaining work

Code: implementation and regression/SQL checks passed. Full Vitest: 1,487 tests / 141 files; typecheck passed; lint: 0 errors / 145 warnings. Independent review against a committed revision remains pending.

Real PostgreSQL fixture: simultaneous Open yields one reservation/history entry; replay preserves the deadline; classification/surface contention reads current state; failed persistence rolls back; cancellation/reassignment winners and service-only permissions are preserved. Hook regressions exercise delayed automatic Open/Confirm, resolved and thrown Open failures, failed confirmation, unconfirmed success payload and duplicate taps. Footer tests keep offers unavailable before confirmed readiness.
Configured database: migration 082 applied and execute denied to anon/authenticated, granted to service_role. Authenticated localhost smoke passed new request -> concurrent Open (one active reservation) -> Confirm -> replay without deadline reset -> first NGN 5,000 labour offer observed by customer. Realtime delivered 7 customer and 5 pro events; pairing-sweep returned 200; unpaid test request cancelled. Evidence: `/private/tmp/ona-pairing-acceptance-live-evidence.json`. An earlier attempt was interrupted by a Turbopack crash; server restarted and that test request cleaned up before successful retry. These are HTTP/realtime checks, not rendered browser interaction.

External: Browser-rendered visual smoke requires a browser automation connection; currently unavailable. Full-history migration replay/deployed-host verification remain pending.

## Closeout

Reviewed commit pending; no commit/merge requested for this step. Update the backend status ledger with evidence and residuals without closing broader Issues 4/5.


### Integration with dev — 2026-10-20

Rebased working-tree context via fast-forward to `4d5d95e`, then restored local work. The negotiation-footer conflict preserves dev's redesigned controls while requiring confirmed, unexpired negotiation before Send/Accept. Footer regression adapted to redesigned props and Send label. Combined checks: 1,585 tests / 159 files passed, typecheck passed, lint 0 errors / 139 warnings. Work remains uncommitted; browser smoke/human review and hosted checks remain pending. Recovery stash retained.

# Feature review guides

Before a new feature or report fix, remind the user to prepare its guide and show the implementation plan first. If that exact plan was already approved, continue without repeating approval.

Copy `TEMPLATE.md` to `<feature>.md`, link the agreed plan, and map all requirements to verification criteria. A paired JSON file records IDs, expectations, verification methods, `pending`/`pass`/`fail` statuses, evidence, and a `remainingWork` section split into `code` and `external` arrays. Always state what's left, even when an array is empty; use an explicit verified-none entry rather than omitting the section. Include implementation, tests/review, migrations, configuration, rollout, monitoring, and operational follow-up where relevant. Issue 6 demonstrates the machine-readable structure.

Record the exact reviewed commit when available. Keep code verification and hosted/release verification separate. At closeout, reconcile the guide's code and external residuals with `docs/BACKEND_FIXES_STATUS.md`; do not call an issue fully closed while required residual tasks remain. Update the guide when scope changes and identify deferred blockers explicitly. Do not record credentials or personal production data as evidence.

This is currently a manual workflow. There are no review generator, validator, Git-hook or CI commands. The local weekly commit tracker remains independent.

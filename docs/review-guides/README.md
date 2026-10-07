# Feature review guides

Before a new feature or report fix, remind the user to prepare its guide and show the implementation plan first. If that exact plan was already approved, continue without repeating approval.

Copy `TEMPLATE.md` to `<feature>.md`, link the agreed plan, and map all requirements to verification criteria. A paired JSON file may record IDs, expectations, verification methods, `pending`/`pass`/`fail` statuses and evidence. Issue 3 is the first example.

Record the exact reviewed commit when available. Keep code verification and hosted/release verification separate. Update the guide when scope changes and identify deferred blockers explicitly. Do not record credentials or personal production data as evidence.

This is currently a manual workflow. There are no review generator, validator, Git-hook or CI commands. The local weekly commit tracker remains independent.

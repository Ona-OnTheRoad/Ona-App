# Feature review guide

## Goal

Describe the observable behavior and link the agreed plan.

## Expected change areas

List likely files, affected workflows and protected rules to preserve.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

Record excluded scope, outstanding blockers and deployment checks.

## Remaining work

List concrete follow-up work after this implementation. Separate items that require code, tests, review, or migration work from items that require hosted configuration, deployment, external services, or operational ownership. If none remain in a category, state that it was checked and no work remains. Do not treat passing local tests as proof of hosted completion.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.

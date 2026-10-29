# Git and PR attribution

## Hard ban — AI / agent attribution

Never attribute work to an AI, agent, assistant, or tooling product as author, co-author, or contributor.

This applies to **every** surface that ships with the change:

- Commit subject and body
- `Co-authored-by`, `Signed-off-by`, `Acked-by`, and any other git trailer
- PR title, description, summary, test plan, labels text, and comments added while opening or updating the PR
- Branch names and review-guide / handoff notes created for the change

### Forbidden examples (non-exhaustive)

- `Co-authored-by: Cursor <cursoragent@cursor.com>`
- `Co-authored-by: Copilot`, Claude, ChatGPT, Composer, Devin, or similar
- PR body lines like “Generated with Cursor”, “Assisted by …”, “AI co-author: …”
- Listing an agent in “Contributors”, “Credits”, or “Authors”

If a tool or environment auto-appends such a trailer or footer, **strip it before push**. Amend only when the commit is yours and unpushed, or use force-with-lease on a feature branch the user owns. Do not leave AI attribution on `origin`.

Human teammates remain valid `Co-authored-by` targets when the user asks for that.

## Commit messages

- Prefer short conventional subjects used in this repo: `fix:`, `feat:`, `ci:`, `docs:`, `refactor:`, with an optional scope (`fix(profile): …`).
- Explain **why** in the body when the subject is not enough; do not dump file lists.
- Only commit when the user asks. Do not push unless asked (except when they asked to fix or land a PR and push is required).

## Pull requests

- Title and body describe the human change and verification only.
- No AI/agent branding, badges, or “made with …” footers.
- Do not invent co-authors.

## Author identity

- Use the existing local git `user.name` / `user.email`. Never change git config.
- Never set the commit author to an AI or agent identity.

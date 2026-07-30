---
description: Monthly refresh of the AI tool database — re-verify facts, update dates, flag discontinued, propose additions.
allowed-tools: Read, Edit, Write, Glob, Grep, WebSearch, WebFetch, Bash
---

Run the monthly maintenance pass on the AI tool database.

First read @MAINTENANCE.md and follow its rubric, provenance, and guardrail rules exactly.

Then, for every tool file in `src/content/tools/` (work through them by category to stay organized):

1. Web-search to verify current facts: is it still operating? Current pricing model (`free`/`freemium`/`trial`/`paid`)? Any major change to what it does or how it's positioned? Check against 1–2 real, current sources.
2. Update any fields that changed (tagline, bestFor, features, pricing, and `capability` only if the tool's abilities materially shifted). Re-apply the `strength`/`autonomy` rubric consistently — don't let scores drift without a documented reason.
3. Set `lastVerified` to today's date and replace `sources` with the URLs you actually checked this pass.
4. If a tool looks discontinued, renamed, or acquired-and-shut, **do not delete it silently** — list it under "Flagged" with what you found and a recommendation.
5. **Never invent or modify `affiliateUrl`.** Leave it exactly as it is.
6. Propose 2–5 new tools worth adding (name, category, one-line why) — but don't author them here; that's `/add-tool`.
7. Run `npm run build` and fix any schema-validation errors.
8. Finish with a concise report — **Updated** (what changed), **Flagged** (needs a decision), **Proposed** (new tools) — and show `git diff --stat`. **Do not commit or push**; leave everything for human review and merge.

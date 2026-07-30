---
description: Research and add a new AI tool to the database, scored via the rubric.
argument-hint: <tool name>
allowed-tools: Read, Write, Glob, WebSearch, WebFetch, Bash
---

Add the tool "$ARGUMENTS" to the database.

First read @MAINTENANCE.md and follow its schema, rubric, provenance, and guardrail rules exactly.

Then:

1. Web-search to confirm "$ARGUMENTS" exists and gather current facts: what it does, which of the 12 taxonomy tasks it genuinely covers, its pricing model, key features, and positioning. Collect 1–2 real source URLs.
2. Score its `capability` with the rubric (`strength` + `autonomy` for each task it covers), grounded in the sources and consistent with how similar tools are already scored.
3. Author `src/content/tools/<slug>.md` matching the schema exactly (`<slug>` = a lowercase, hyphenated name). **Leave `affiliateUrl` out** — a human adds that later. Set `lastVerified` to today, cite your sources, and pick an `accentColor` from the tool's brand.
4. Run `npm run build` and fix any validation errors.
5. Show the new file and confirm it builds. **Do not commit** — leave it for review.

If the tool doesn't clearly fit any of the 12 tasks, or you can't verify it exists, say so instead of inventing an entry.

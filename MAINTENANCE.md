# Maintaining the AI tool database

The tool database is the heart of this site. Each tool is one schema-validated
Markdown file in `src/content/tools/`. This is the reference for keeping it
accurate and consistent — read it before running a refresh or adding a tool.

The two slash commands (`/refresh-tools`, `/add-tool`) follow these rules.

## Where things live

- **Tool files:** `src/content/tools/<slug>.md` — the slug is the filename _and_
  the `/go/<slug>` affiliate link.
- **Schema (rules, enforced at build):** `src/content.config.ts`
- **Scoring transform (rubric → engine):** `src/lib/tools.ts`

## The taxonomy (12 tasks)

`writing, email, meetings, research, scheduling, notes, automation, coding,
design, video, marketing, presentations`.

A tool lists only the tasks it's genuinely good at, under `capability`. Adding a
new task means editing the enum in `src/content.config.ts` — a deliberate change.

## The rubric — this is what keeps rankings consistent

Per task, two anchored judgments.

**`strength`** — how good it is at the task:

- `weak` — can do it, but it's not what the tool is for
- `solid` — competent; gets the job done
- `strong` — notably good; a top option for this task
- `best` — the category leader for this task

**`autonomy`** — how much of the work it takes off your hands (maps to the "how
much control" slider):

- `suggest` — assists; you do the work (autocomplete, ideas)
- `assist` — drafts / helps you decide; you review and finish
- `most` — does most of it; you supervise and approve
- `auto` — you set it and it handles the task

Apply the **same yardstick to every tool**. If a ranking looks wrong, fix the
rubric reasoning — don't fudge one tool's numbers. The engine computes the 1–4
control curve from these two values (`src/lib/tools.ts`).

## Provenance (non-negotiable)

- `lastVerified`: the date you actually checked the facts. Set to **today** on
  every verify pass.
- `sources`: the real URLs you checked **this pass**.
- **Verify with web search — never from memory.** Pricing and features change
  constantly.

## Money (the guardrail)

- `affiliateUrl` is **human-owned. NEVER invent, guess, or change it.** If a tool
  has no affiliate link, leave the field out — that's expected.
- Monetization is **derived**: a tool with an affiliate link gets a small ranking
  nudge automatically, and it can never override a genuinely better match. Don't
  set `monetizeOverride` unless a human explicitly asks.

## Pricing

- `pricing` is just the model: `free | freemium | trial | paid`. **No specific
  prices** anywhere — they go stale and add no value.

## Quality bar

Grounded in sources, consistent rubric, honest. **Quality > quantity** — a
recommender is only as trustworthy as its worst entry.

## The monthly pass — `/refresh-tools`

1. For each tool: web-search to confirm it still operates, check the current
   pricing model, and note any major feature/positioning change.
2. Update changed fields; re-apply the rubric consistently.
3. Bump `lastVerified` to today; refresh `sources`.
4. **Flag** (don't silently delete) anything discontinued / renamed / acquired.
5. Never touch `affiliateUrl`.
6. Propose new tools worth adding.
7. `npm run build` to validate against the schema; fix errors.
8. Present the diff for human review. **Do not commit or push** — a human
   approves and merges.

## Adding one tool — `/add-tool <name>`

Same rules: research it, score with the rubric, author a schema-valid file with
sources + today's `lastVerified`, leave `affiliateUrl` out, build to validate,
leave it for review.

## Deploying

Merges to `main` deploy automatically via GitHub Actions
(`.github/workflows/deploy.yml`). Locally you can still run
`npm run build && npx wrangler deploy`.

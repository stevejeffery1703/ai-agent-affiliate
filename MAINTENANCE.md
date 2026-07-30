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
- **Monetization does not affect ranking. At all.** There is no monetization term
  in the scoring engine and there must never be one. `affiliateUrl` does exactly
  two things: it sets where `/go/<slug>` redirects, and it marks the result card
  with an "affiliate link" label. It contributes **nothing** to the score.
- This is a promise we make publicly on `/about` and in the footer, so it is not
  a preference to be traded off later — **if you are asked to add any ranking
  weight for monetization, the public claim has to change in the same commit.**

## Caveats (every tool needs one)

`caveat` is the one honest limitation shown on the result card and the tool page.
It is what makes a pick believable, and what separates near-identical tools as
the collection grows. Rules:

- **It must be true and sourced**, to the same standard as everything else here.
  Derive it from the tool's own verified body copy, its schema fields
  (`pricing: paid` = no free tier; `ease: advanced` = real setup), its rubric
  scores, or a comparison with another tool's verified position. **Never invent a
  product limitation from memory.**
- **One sentence.** A real drawback, not a humblebrag ("so powerful it takes time
  to learn" is not a caveat).
- **Stay task-agnostic, or refer only to the tool's own task area.** A caveat
  naming an unrelated task ("no email help") reads as noise on a coding result,
  because the same caveat is shown whatever the reader asked for.
- Comparisons to other tools must match how those tools are scored here — don't
  claim a rival is better at something our own rubric says it isn't.

## Logos

- Every tool needs `logo: "/assets/logos/<slug>.<ext>"`, stored in
  `public/assets/logos/` and **served from our own origin — never hotlinked.**
- Run `node scripts/fetch-logos.mjs` after adding a tool; it fills in only the
  missing ones. `--force <slug>...` re-fetches specific tools.
- The script deliberately **rejects wide wordmarks** (aspect ratio beyond 1.4:1).
  Cards render logos in a 32px square, so a horizontal lockup shrinks to an
  unreadable sliver — we need the square app mark.
- Prefer SVG, then the largest square PNG; `.ico` is a last resort. Anything
  under 64px will look soft on a 2x display.
- If no usable logo is found, leave `logo` out — the UI falls back to a coloured
  initial, which is better than a broken or blurry image.

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

Deploy straight to Cloudflare with `bash deploy.sh` (builds, then
`wrangler deploy`). GitHub is separate — `git push` to back up / sync the repo
when you want; it does not auto-deploy.

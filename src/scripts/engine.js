// ==========================================
// SCORING ENGINE + ROLE ASSIGNMENT
//
// Three jobs, all pure (no DOM), in order:
//   1. shortlist()    rank the tools that can do the task at all
//   2. assignRoles()  award each pick a role it actually earned
//   3. buildReasons() say why, specifically, in terms the reader can check
//
// Design rule that makes this survive the collection growing: roles are
// DIMENSION WINNERS, not list positions. "Best free option" means "won on
// price", not "came third". That logic is identical at 3 tools per task or 40,
// and a role is simply omitted when no distinct tool earns it — we never pad
// the page with a pick we can't defend.
// ==========================================

// Every term here varies across tools. The previous engine spent 45% of its
// weight on a task-match term that was always 1 (the eligibility gate below had
// already guaranteed it) and 5% on a monetization term that was always 0, so
// only half the weight did any work and scores never fell below 65%.
const WEIGHTS = {
  fit: 0.58, // capability at the control level the user asked for
  ease: 0.3, // how well its learning curve matches what they want
  quality: 0.12, // sourced rating — a real but deliberately small signal
};

const EASE_RANK = { easy: 0, medium: 1, advanced: 2 };
const AUTONOMY_RANK = { suggest: 1, assist: 2, most: 3, auto: 4 };

// Phrasing for the control level, written to slot into "For research, when ___."
export const CONTROL_SCOPE = {
  1: 'you just want suggestions',
  2: 'you want help deciding',
  3: 'you want it to do most of the work',
  4: 'you want it handled end to end',
};

// Asymmetric on purpose. A tool SIMPLER than you asked for is barely a problem
// — you just won't use its ceiling. A tool HARDER than you asked for is the
// actual mismatch: it's the one you'll bounce off. The old engine penalised
// both equally, which (over a collection that is mostly "easy") meant asking for
// "powerful" dragged every score down and made the site look worse at answering
// the question you'd just asked it.
function easeFit(want, has) {
  const delta = EASE_RANK[has] - EASE_RANK[want];
  if (delta <= 0) return 1 + delta * 0.08; // simpler: 1.00 / 0.92 / 0.84
  return Math.max(0, 1 - delta * 0.45); // harder:  0.55 / 0.10
}

// Ratings cluster in a narrow band (4.2-4.9 today), so /5 would flatten them to
// nothing. Map [4,5] onto [0,1] instead, and keep the weight small so a soft
// aggregated number can never outvote genuine fit.
function qualityScore(rating) {
  if (typeof rating !== 'number') return 0.5; // neutral prior for unrated tools
  return Math.min(1, Math.max(0, rating - 4));
}

function scoreTool(user, tool) {
  const fit = tool.capability?.[user.task]?.[String(user.control)] ?? 0;
  return (
    WEIGHTS.fit * fit +
    WEIGHTS.ease * easeFit(user.ease, tool.ease) +
    WEIGHTS.quality * qualityScore(tool.rating)
  );
}

/**
 * Rank every tool that can do the task, after the price filter.
 * Returns the ranking plus the counts needed to say "we compared N tools" —
 * which is both a trust signal and the honest framing for a shortlist.
 */
export function shortlist(user, tools) {
  // Eligibility gate: a tool without a capability entry for this task simply
  // cannot do it. This is a gate, never a score.
  const capable = tools.filter((t) => t.capability?.[user.task] !== undefined);
  const eligible = user.freeOnly ? capable.filter((t) => t.isFree) : capable;

  const ranked = eligible
    .map((tool) => ({ ...tool, score: scoreTool(user, tool) }))
    // Deterministic: score, then the sourced rating, then name. Without the
    // explicit tiebreaks, near-identical tools would order by filename.
    .sort(
      (a, b) =>
        b.score - a.score || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)
    );

  return { ranked, capableN: capable.length, eligibleN: eligible.length };
}

// Tools within this window of the leader are genuinely indistinguishable, and
// saying so is more honest than manufacturing a winner from a rounding error.
// The window tightens as the collection grows (more tools = denser clustering =
// a fixed window would flag half the page as tied), and we name at most two.
function tieWindow(n) {
  return Math.max(0.006, 0.015 - 0.0004 * Math.max(0, n - 5));
}

// The page always shows this many cards (when the shortlist is that deep):
// one primary plus two alternates, so the layout — and the promise "pick the
// one that fits you" — doesn't depend on how the data happens to fall out for
// a given query.
const CARD_COUNT = 3;

/**
 * Award roles. "Our pick" always leads. The other slots go, in priority
 * order, to: a genuine co-leader (statistically tied, so it's a real
 * alternative rather than a footnote), then tools that earned a distinct
 * dimension (free / easy / hands-off), then — only if slots are still open —
 * the next-best-ranked tool, so the row is never padded with less than the
 * data actually supports but is also never thinner than three when there's
 * enough of a shortlist to fill it.
 */
export function assignRoles(ranked, user) {
  if (!ranked.length) return { roles: [] };

  const roles = [];
  const taken = new Set();
  const top = ranked[0];

  roles.push({ tool: top, role: 'Our pick', basis: 'overall' });
  taken.add(top.id);

  const fill = (candidates) => {
    for (const c of candidates) {
      if (roles.length >= CARD_COUNT) return;
      if (taken.has(c.tool.id)) continue;
      roles.push(c);
      taken.add(c.tool.id);
    }
  };

  // Co-leaders first: a tool within a rounding error of the top score is a
  // stronger claim on a slot than any earned dimension.
  fill(
    ranked
      .slice(1)
      .filter((t) => top.score - t.score < tieWindow(ranked.length))
      .map((t) => ({ tool: t, role: 'Also a top pick', basis: 'tie' }))
  );

  const earned = [];

  // Only meaningful when our pick ISN'T already free — otherwise it's padding.
  if (!user.freeOnly && !top.isFree) {
    const free = ranked.find((t) => t.isFree && !taken.has(t.id));
    if (free) earned.push({ tool: free, role: 'Best free option', basis: 'free' });
  }

  // Only when our pick isn't already the easiest tier.
  if (EASE_RANK[top.ease] > 0) {
    const easier = ranked.find((t) => EASE_RANK[t.ease] < EASE_RANK[top.ease] && !taken.has(t.id));
    if (easier) earned.push({ tool: easier, role: 'Easiest to start with', basis: 'ease' });
  }

  // Only when something genuinely runs further unsupervised than our pick.
  const topAutonomy = AUTONOMY_RANK[top.rubric?.[user.task]?.autonomy] ?? 0;
  const handsOff = ranked
    .filter((t) => !taken.has(t.id))
    .sort(
      (a, b) =>
        (AUTONOMY_RANK[b.rubric?.[user.task]?.autonomy] ?? 0) -
        (AUTONOMY_RANK[a.rubric?.[user.task]?.autonomy] ?? 0)
    )[0];
  if (handsOff && (AUTONOMY_RANK[handsOff.rubric?.[user.task]?.autonomy] ?? 0) > topAutonomy) {
    earned.push({ tool: handsOff, role: 'Most hands-off', basis: 'autonomy' });
  }

  fill(earned);

  // Still short a slot: nothing distinct separates the next tool from our
  // pick, so say that plainly instead of inventing a role it didn't earn.
  fill(
    ranked
      .slice(1)
      .filter((t) => !taken.has(t.id))
      .map((t) => ({ tool: t, role: 'Also worth a look', basis: 'alternate' }))
  );

  return { roles };
}

// A generalist's bestFor ("Writing, research, and everyday AI help") makes a
// useless contrast — "choose X unless you need everyday AI help" says nothing.
// The comparison only earns its place against a tool with a narrow speciality.
function isSpecialist(tool) {
  return Object.keys(tool.capability || {}).length <= 2;
}

/**
 * Why this tool, specifically — the part the whole page's credibility rests on.
 * Anatomy: what it's actually for (authored) -> why it won this dimension (our
 * judgement, owned as ours) -> what to pick instead (computed contrast) -> the
 * tradeoff (authored).
 *
 * `shownIds` are tools already on the page under their own role card. The
 * contrast exists to surface an alternative the reader would otherwise miss,
 * so pointing at a card they can already see is just noise.
 */
export function buildReasons(entry, ranked, user, shownIds = new Set()) {
  const { tool, basis } = entry;
  const out = [];

  // 1. The specific, human-authored bit. This is the differentiator, so it
  //    leads — the old card buried it under generated filler.
  out.push({ kind: 'purpose', text: tool.bestFor });

  if (basis === 'overall') {
    const rub = tool.rubric?.[user.task];
    // Attributed to OUR rubric on purpose. An unattributed "rated strongest"
    // reads as a borrowed verdict we can't back up.
    if (rub?.strength === 'best') {
      out.push({
        kind: 'judgement',
        text: `The strongest ${user.task} capability in our rubric, of the ${ranked.length} we compared.`,
      });
    }
    if ((AUTONOMY_RANK[rub?.autonomy] ?? 0) >= user.control) {
      out.push({ kind: 'judgement', text: 'Runs unsupervised at the level you asked for.' });
    }
    const runnerUp = ranked.find((t) => t.id !== tool.id && !shownIds.has(t.id));
    if (runnerUp && isSpecialist(runnerUp)) {
      // Colon frame on purpose: bestFor is authored prose that may start with a
      // proper noun ("Google users who..."), so it has to be dropped in verbatim
      // rather than case-folded into the middle of a sentence.
      out.push({
        kind: 'contrast',
        text: `Pick ${runnerUp.name} instead — it's built for: ${runnerUp.bestFor}.`,
      });
    }
  }

  if (basis === 'free') {
    out.push({ kind: 'judgement', text: "Covers this task on its free plan — our pick doesn't." });
  }
  if (basis === 'ease') {
    out.push({ kind: 'judgement', text: 'Works out of the box, with less setup than our pick.' });
  }
  if (basis === 'autonomy') {
    out.push({ kind: 'judgement', text: 'Runs further unsupervised than our pick.' });
  }
  if (basis === 'tie') {
    out.push({
      kind: 'judgement',
      text: "Scored within a hair of our pick in this comparison — a genuine tie, not a runner-up.",
    });
  }
  if (basis === 'alternate') {
    const rank = ranked.findIndex((t) => t.id === tool.id) + 1;
    out.push({
      kind: 'judgement',
      text: `Ranked #${rank} for ${user.task} in our comparison — close behind our pick, without a standout tradeoff either way.`,
    });
  }

  // 4. The tradeoff. Rendered distinctly — it's the honesty signal, not filler.
  if (tool.caveat) out.push({ kind: 'caveat', text: tool.caveat });

  return out;
}

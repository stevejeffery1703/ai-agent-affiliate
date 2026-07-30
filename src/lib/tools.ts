import type { CollectionEntry } from 'astro:content';

// Rubric anchors -> numbers.
const STRENGTH: Record<string, number> = { weak: 0.4, solid: 0.6, strong: 0.8, best: 0.95 };
const AUTONOMY: Record<string, number> = { suggest: 1, assist: 2, most: 3, auto: 4 };

// Pricing model -> the engine's price bucket (freemium counts as "has a free
// tier" for the free-only filter; trial is treated as paid).
const PRICE_MODEL: Record<string, string> = {
  free: 'free',
  freemium: 'freemium',
  trial: 'paid',
  paid: 'paid',
};

// Stable, low-maintenance pricing label shown on cards (no specific numbers).
const PRICE_LABEL: Record<string, string> = {
  free: 'Free',
  freemium: 'Free plan available',
  trial: 'Free trial',
  paid: 'Paid plans available',
};

// Compute the capability score at each control level (1-4) from the two rubric
// values: full strength up to the tool's autonomy ceiling, then a linear taper.
function curve(strengthKey: string, autonomyKey: string): Record<string, number> {
  const s = STRENGTH[strengthKey] ?? 0;
  const a = AUTONOMY[autonomyKey] ?? 1;
  const out: Record<string, number> = {};
  for (let level = 1; level <= 4; level++) {
    const falloff = level <= a ? 1 : Math.max(0.15, 1 - 0.3 * (level - a));
    out[String(level)] = Math.round(s * falloff * 100) / 100;
  }
  return out;
}

// "Verified Jul 2026" — provenance shown on the card, so the reader can see how
// fresh the judgement is without leaving the page.
function verifiedLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Turn a validated content-collection entry into the plain object the scoring
// engine expects. This is where the parametric model + /go redirects are
// applied.
//
// NOTE: monetization deliberately does NOT appear here. Affiliate status is
// passed through as `isAffiliate` for DISCLOSURE only — it must never influence
// ranking, which is the one claim about our independence a reader can check.
export function toEngineTool(entry: CollectionEntry<'tools'>) {
  const d = entry.data;

  const capability: Record<string, Record<string, number>> = {};
  // The raw rubric anchors travel with the tool: role assignment compares
  // autonomy/strength directly, which the collapsed curve can't express.
  const rubric: Record<string, { strength: string; autonomy: string }> = {};
  for (const [task, c] of Object.entries(d.capability)) {
    if (c) {
      capability[task] = curve(c.strength, c.autonomy);
      rubric[task] = { strength: c.strength, autonomy: c.autonomy };
    }
  }

  const price = PRICE_MODEL[d.pricing] ?? 'paid';

  return {
    id: entry.id,
    name: d.name,
    url: `/go/${entry.id}`, // single indirection point for the affiliate link
    capability,
    rubric,
    ease: d.ease,
    price,
    priceLabel: PRICE_LABEL[d.pricing] ?? '',
    isFree: price === 'free' || price === 'freemium',
    isAffiliate: Boolean(d.affiliateUrl), // disclosure only — never scored
    rating: d.rating ?? null,
    logo: d.logo ?? null,
    accentColor: d.accentColor ?? null,
    tagline: d.tagline,
    bestFor: d.bestFor,
    caveat: d.caveat ?? null,
    features: d.features,
    badges: d.badges,
    verified: verifiedLabel(d.lastVerified),
    sources: d.sources,
  };
}

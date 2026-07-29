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

// Turn a validated content-collection entry into the plain object the scoring
// engine expects. This is where the parametric model + derived monetization +
// /go redirects are applied — the runtime engine stays unchanged.
export function toEngineTool(entry: CollectionEntry<'tools'>) {
  const d = entry.data;

  const capability: Record<string, Record<string, number>> = {};
  for (const [task, c] of Object.entries(d.capability)) {
    if (c) capability[task] = curve(c.strength, c.autonomy);
  }

  // Monetization nudge: derived from having an affiliate link (user's rule),
  // unless a manual override is set.
  const priority = d.monetizeOverride ?? (d.affiliateUrl ? 1 : 0);

  return {
    id: entry.id,
    name: d.name,
    url: `/go/${entry.id}`, // single indirection point for the affiliate link
    tasks: Object.keys(capability),
    capability,
    ease: d.ease,
    price: PRICE_MODEL[d.pricing.model] ?? 'paid',
    priceLabel: d.pricing.startingPrice ?? '',
    priority,
    logo: d.logo ?? null,
    accentColor: d.accentColor ?? null,
    tagline: d.tagline,
    bestFor: d.bestFor,
    features: d.features,
    badges: d.badges,
  };
}

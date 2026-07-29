import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---------------------------------------------------------------------------
// CANONICAL TAXONOMY
// One shared list of tasks, used by both the quiz and every tool entry.
// Adding a task is a deliberate one-line change here.
// ---------------------------------------------------------------------------
export const TASKS = [
  'writing',        // drafts, articles, copy, editing
  'email',          // inbox triage, fast replies
  'meetings',       // record, transcribe, summarize
  'research',       // find & synthesize with citations
  'scheduling',     // calendar, time-blocking, tasks
  'notes',          // capture & organize knowledge/docs
  'automation',     // connect apps, multi-step agents
  'coding',         // write code, build apps
  'design',         // generate/edit images & graphics
  'video',          // video/audio: avatars, clips, voiceover
  'marketing',      // social, ads, SEO, campaigns
  'presentations',  // slide decks from a prompt
] as const;

const task = z.enum(TASKS);

// ---------------------------------------------------------------------------
// RUBRIC-ENFORCED CAPABILITY
// Per task, two anchored judgments. The 1-4 control curve is COMPUTED from
// these at build time (see src/lib/tools.ts), so scores stay consistent.
//   strength  = how good it is at the task
//   autonomy  = how much it can do hands-off (maps to the control slider)
// ---------------------------------------------------------------------------
const capabilityEntry = z.object({
  strength: z.enum(['weak', 'solid', 'strong', 'best']),
  autonomy: z.enum(['suggest', 'assist', 'most', 'auto']),
});

// A tool provides capability only for the tasks it actually does, so this is a
// PARTIAL map with every task optional. (A record keyed by the task enum would
// wrongly require all 12.) `.strict()` catches typo'd task names; the refine
// requires at least one real capability.
const cap = capabilityEntry.optional();
const capability = z
  .object({
    writing: cap,
    email: cap,
    meetings: cap,
    research: cap,
    scheduling: cap,
    notes: cap,
    automation: cap,
    coding: cap,
    design: cap,
    video: cap,
    marketing: cap,
    presentations: cap,
  })
  .strict()
  .refine((c) => Object.values(c).some(Boolean), {
    message: 'Provide capability for at least one task',
  });

const tools = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/tools' }),
  schema: z.object({
    name: z.string(),
    category: task, // primary task area (used for grouping/badges)
    // Which tasks it's good at + the rubric scores. The engine derives the
    // tool's task list from the keys here.
    capability,
    ease: z.enum(['easy', 'medium', 'advanced']),
    // Just the model — no specific prices (they go stale and add no value).
    pricing: z.enum(['free', 'freemium', 'trial', 'paid']),
    websiteUrl: z.string().url(),
    // Human-owned. Omitted until we're in the program; NEVER invented.
    // When present, the tool earns the (small) monetization nudge.
    affiliateUrl: z.string().url().optional(),
    // Rare manual override for the derived monetization weight (0-1).
    monetizeOverride: z.number().min(0).max(1).optional(),
    logo: z.string().optional(),
    accentColor: z.string().optional(),
    tagline: z.string(),
    bestFor: z.string(),
    features: z.array(z.string()).default([]),
    badges: z.array(z.string()).default([]),
    rating: z.number().min(0).max(5).optional(),
    // Provenance: when the facts were last checked, and where from.
    lastVerified: z.coerce.date(),
    sources: z.array(z.string().url()).default([]),
  }),
});

export const collections = { tools };

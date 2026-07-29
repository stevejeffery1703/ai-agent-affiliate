// ==========================================
// TOOLS DATA (TEMPORARY)
// ------------------------------------------
// Ported verbatim from the original build to keep the recommender
// working during the migration. This whole file is REPLACED in a
// later step by the schema-validated Astro content collection
// (src/content/tools/*), which is what Claude will maintain.
// ==========================================

export const TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chat.openai.com", // <-- replace with affiliate link
    tasks: ["writing", "research", "coding", "email"],
    capability: {
      writing: { 1: 0.95, 2: 0.95, 3: 0.9, 4: 0.7 },
      research: { 1: 0.9, 2: 0.9, 3: 0.8, 4: 0.6 },
      coding: { 1: 0.9, 2: 0.85, 3: 0.8, 4: 0.6 },
      email: { 1: 0.7, 2: 0.6, 3: 0.4, 4: 0.1 },
    },
    ease: "easy",
    price: "freemium",
    priority: 0.7,
    logo: "/assets/logos/chatgpt.png",
    tagline: "Your all-purpose AI assistant",
    bestFor: "Best for writing, research, and everyday AI help",
    features: [
      "Writes and edits content quickly",
      "Answers complex questions clearly",
      "Helps with coding and problem-solving",
    ],
    badges: ["Popular", "Beginner-friendly"],
    accentColor: "#10a37f",
  },

  {
    id: "superhuman",
    name: "Superhuman",
    url: "https://superhuman.com", // <-- replace with affiliate link
    tasks: ["email"],
    capability: {
      email: { 1: 0.9, 2: 0.9, 3: 0.8, 4: 0.6 },
    },
    ease: "medium",
    price: "paid",
    priority: 0.9,
    logo: "/assets/logos/superhuman.png",
    tagline: "The fastest email experience ever made",
    bestFor: "Best for high-volume email users",
    features: [
      "Blazing-fast keyboard-driven workflow",
      "AI-assisted email writing",
      "Designed for inbox zero",
    ],
    badges: ["Premium"],
    accentColor: "#000000",
  },
];

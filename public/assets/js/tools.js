// ==========================================
// TOOLS DATABASE
// Easy to edit, expand, and monetize
// ==========================================

export const TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chat.openai.com", // <-- replace with affiliate link later

    // CORE MATCHING TAGS
    tasks: ["writing", "research", "general"],
    control: 1, // 1 = advise, 4 = fully autonomous

    // CONSTRAINTS
    price: "freemium",
    ease: "easy",

    // BUSINESS
    priority: 0.7, // monetization boost (0–1)

    // DISPLAY
    description: "Great all-round AI for writing, research, and everyday tasks."
  },

  {
    id: "superhuman",
    name: "Superhuman",
    url: "https://superhuman.com",

    // CORE MATCHING TAGS
    tasks: ["email", "productivity"],
    control: 3,

    // CONSTRAINTS
    price: "paid",
    ease: "medium",

    // BUSINESS
    priority: 0.9,

    // DISPLAY
    description: "High-speed email workflow tool for professionals."
  }
];

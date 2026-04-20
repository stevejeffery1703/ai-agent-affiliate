// ==========================================
// TOOLS DATABASE
// Easy to edit, expand, and monetize
// ==========================================

export const TOOLS = [

// ===============
// === CHATGPT ===
// ===============
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chat.openai.com", // <-- replace with affiliate link
    
    // CORE MATCHING TAGS
    tasks: ["writing", "research", "coding", "email"],

    // CAPABILITY MATRIX
    // Include one line for each core matching tag
    // 1: I just want suggestions, 2: Help me decide, 3: Do most of the work, 4: Handle it for me 
    capability: {
      writing: {
        1: 0.95, 2: 0.95, 3: 0.9, 4: 0.7
      },

      research: {
        1: 0.9, 2: 0.9, 3: 0.8, 4: 0.6
      },

      coding: {
        1: 0.9, 2: 0.85, 3: 0.8, 4: 0.6
      },

      email: {
        1: 0.7, 2: 0.6, 3: 0.4, 4: 0.1
      }
    },
    
    // CONSTRAINTS
    ease: "easy",
    price: "freemium",

    // BUSINESS MONETIZATION BOOST (0-1)
    priority: 0.7,
   
    // DISPLAY
    description: "Great all-round AI assistant."
  },


// ==================
// === SUPERHUMAN ===
// ==================
  {
    id: "superhuman",
    name: "Superhuman",
    url: "https://superhuman.com", // <-- replace with affiliate link

    // CORE MATCHING TAGS
    tasks: ["email"],

    // CAPABILITY MATRIX
    // Include one line for each core matching tag
    // 1: I just want suggestions, 2: Help me decide, 3: Do most of the work, 4: Handle it for me 
    capability: {
      email: {
        1: 0.9, 2: 0.9, 3: 0.8, 4: 0.6
      }
    },

    // CONSTRAINTS
    ease: "medium",
    price: "paid",

    // BUSINESS MONETIZATION BOOST (0-1)
    priority: 0.9,

    // DISPLAY
    description: "High-speed email workflow tool."
  }
];
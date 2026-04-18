// ==========================================
// SCORING ENGINE
// Converts user input to ranked results
// ==========================================

// ==========================================
// WEIGHTS (cleaned model)
// ==========================================

const WEIGHTS = {
  task: 0.4,
  control: 0.3,
  ease: 0.2,
  bonus: 0.1
};

// ==========================================
// MAIN FUNCTION
// ==========================================

export function scoreTools(user, tools) {

  // ==========================================
  // 1. PRICE FILTER (ONLY FILTERING NOW)
  // ==========================================

  let filteredTools = tools;

  // Free-only mode:
  // keep only free + freemium tools
  if (user.price === "free") {
    filteredTools = tools.filter(tool =>
      tool.price === "free" || tool.price === "freemium"
    );
  }

  // "I don't mind paying" or empty:
  // no filtering applied


  // ==========================================
  // 2. SCORE FILTERED TOOLS
  // ==========================================

  return filteredTools.map(tool => {
    const score = calculateScore(user, tool);

    return {
      ...tool,
      score,
      percentage: Math.round(score * 100)
    };
  })
  .sort((a, b) => b.score - a.score);
}

// ==========================================
// CORE SCORING FUNCTION
// ==========================================

function calculateScore(user, tool) {

  const taskMatch = getTaskMatch(user, tool);
  const controlMatch = getControlMatch(user, tool);
  const easeMatch = getEaseMatch(user, tool);
  const bonus = tool.priority || 0;

  return (
    taskMatch * WEIGHTS.task +
    controlMatch * WEIGHTS.control +
    easeMatch * WEIGHTS.ease +
    bonus * WEIGHTS.bonus
  );
}

// ==========================================
// TASK MATCH
// ==========================================

function getTaskMatch(user, tool) {
  if (!user.tasks || !tool.tasks) return 0;

  const matches = user.tasks.filter(t => tool.tasks.includes(t));
  return matches.length / user.tasks.length;
}

// ==========================================
// CONTROL MATCH
// ==========================================

function getControlMatch(user, tool) {
  const min = 1;
  const max = 4;

  const distance = Math.abs(user.control - tool.control);
  const maxDistance = max - min;

  return 1 - (distance / maxDistance);
}

// ==========================================
// EASE MATCH
// ==========================================

function getEaseMatch(user, tool) {
  if (!user.ease || !tool.ease) return 1;

  const levels = {
    easy: 0,
    medium: 1,
    advanced: 2
  };

  const diff = Math.abs(levels[user.ease] - levels[tool.ease]);

  return 1 - (diff / 2);
}
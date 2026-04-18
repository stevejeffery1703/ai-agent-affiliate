// ==========================================
// SCORING ENGINE
// Converts user input to ranked results
// ==========================================

// WEIGHTS (tuned for your new model)
const WEIGHTS = {
  task: 0.35,
  control: 0.25,
  ease: 0.15,          // ? NEW
  constraints: 0.2,
  bonus: 0.05
};

// MAIN FUNCTION
export function scoreTools(user, tools) {
  return tools.map(tool => {
    const score = calculateScore(user, tool);
    return {
      ...tool,
      score,
      percentage: Math.round(score * 100)
    };
  })
  .sort((a, b) => b.score - a.score);
}

// CORE SCORING FUNCTION
function calculateScore(user, tool) {

  const taskMatch = getTaskMatch(user, tool);
  const controlMatch = getControlMatch(user, tool);
  const easeMatch = getEaseMatch(user, tool); // ? NEW
  const constraintsMatch = getConstraintsMatch(user, tool);
  const bonus = tool.priority || 0;

  return (
    taskMatch * WEIGHTS.task +
    controlMatch * WEIGHTS.control +
    easeMatch * WEIGHTS.ease +                 // ? NEW
    constraintsMatch * WEIGHTS.constraints +
    bonus * WEIGHTS.bonus
  );
}

// TASK MATCH
function getTaskMatch(user, tool) {
  if (!user.tasks || !tool.tasks) return 0;

  const matches = user.tasks.filter(t => tool.tasks.includes(t));
  return matches.length / user.tasks.length;
}

// CONTROL MATCH
function getControlMatch(user, tool) {
  const min = 1;
  const max = 4;

  const distance = Math.abs(user.control - tool.control);
  const maxDistance = max - min;

  return 1 - (distance / maxDistance);
}

// CONSTRAINT MATCH
function getConstraintsMatch(user, tool) {
  let score = 0;
  let total = 0;

  if (user.price) {
    total++;
    if (user.price === tool.price) score++;
  }

  return total > 0 ? score / total : 1;
}

// ==========================================
// NEW: EASE MATCH (KEY ADDITION)
// ==========================================

function getEaseMatch(user, tool) {
  if (!user.ease || !tool.ease) return 1;

  const levels = {
    easy: 0,
    medium: 1,
    advanced: 2
  };

  const diff = Math.abs(levels[user.ease] - levels[tool.ease]);

  return 1 - (diff / 2); // normalized 0–1
}
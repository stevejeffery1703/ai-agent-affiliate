// ==========================================
// SCORING ENGINE
// Matrix-based capability model
// (Ported unchanged from the original build.)
// ==========================================

const WEIGHTS = {
  task: 0.45,
  capability: 0.35,
  ease: 0.15,
  bonus: 0.05,
};

export function scoreTools(user, tools) {
  let filteredTools = tools;

  // 1. PRICE FILTER
  if (user.price === "free") {
    filteredTools = filteredTools.filter(
      (tool) => tool.price === "free" || tool.price === "freemium"
    );
  }

  // 2. TASK ELIGIBILITY GATE
  // Remove tools that cannot perform the selected task at all.
  const selectedTask = user.tasks?.[0];
  if (selectedTask) {
    filteredTools = filteredTools.filter(
      (tool) => tool.capability?.[selectedTask] !== undefined
    );
  }

  // 3. SCORE
  return filteredTools
    .map((tool) => {
      const score = calculateScore(user, tool);
      return {
        ...tool,
        score,
        percentage: Math.round(score * 100),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function calculateScore(user, tool) {
  const taskMatch = getTaskMatch(user, tool);
  const capabilityMatch = getCapabilityMatch(user, tool);
  const easeMatch = getEaseMatch(user, tool);
  const bonus = tool.priority || 0;

  return (
    taskMatch * WEIGHTS.task +
    capabilityMatch * WEIGHTS.capability +
    easeMatch * WEIGHTS.ease +
    bonus * WEIGHTS.bonus
  );
}

function getTaskMatch(user, tool) {
  if (!user.tasks || !tool.tasks) return 0;
  const matches = user.tasks.filter((t) => tool.tasks.includes(t));
  return matches.length / user.tasks.length;
}

function getCapabilityMatch(user, tool) {
  const task = user.tasks?.[0];
  const level = user.control;
  if (!task || !level) return 0;

  const taskCapability = tool.capability?.[task];
  if (!taskCapability) return 0;

  const score = taskCapability[String(level)];
  return typeof score === "number" ? score : 0;
}

function getEaseMatch(user, tool) {
  if (!user.ease || !tool.ease) return 1;

  const levels = { easy: 0, medium: 1, advanced: 2 };
  const diff = Math.abs(levels[user.ease] - levels[tool.ease]);
  return Math.max(0, 1 - diff / 2);
}

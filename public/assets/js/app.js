// ==========================================
// MAIN APP LOGIC
// Handles UI ? scoring ? rendering
// ==========================================

import { TOOLS } from './tools.js';
import { scoreTools } from './engine.js';

// RUN WHEN BUTTON CLICKED
document.getElementById("runBtn").addEventListener("click", runRecommendation);

function runRecommendation() {

  // ============================
  // 1. COLLECT USER INPUT
  // ============================

  const user = {
    tasks: [document.getElementById("task").value],

    control: parseInt(document.getElementById("control").value),

    price: document.getElementById("price").value,

    ease: document.getElementById("ease").value // ? UPDATED (was skill)
  };

  // ============================
  // 2. SCORE TOOLS
  // ============================

  const results = scoreTools(user, TOOLS).slice(0, 5);

  // ============================
  // 3. RENDER RESULTS
  // ============================

  renderResults(results);
}

// ==========================================
// RENDER FUNCTION
// ==========================================

function renderResults(results) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  results.forEach(tool => {

    const label = getLabel(tool.percentage);

    const el = document.createElement("div");
    el.className = "result-card";

    el.innerHTML = `
      <h3>${tool.name}</h3>

      <div class="score-bar">
        <div class="score-fill" style="width:${tool.percentage}%"></div>
      </div>

      <p><strong>${tool.percentage}% match</strong> — ${label}</p>

      <p>${tool.description}</p>

      <a href="${tool.url}" target="_blank" class="button button-primary">
        Try ${tool.name}
      </a>
    `;

    container.appendChild(el);
  });
}

// LABELS
function getLabel(score) {
  if (score >= 90) return "Excellent fit";
  if (score >= 75) return "Great match";
  if (score >= 60) return "Good option";
  return "Less ideal";
}
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
    ease: document.getElementById("ease").value
  };

  // ============================
  // 2. RUN ENGINE (FREE MODE)
  // ============================

  const freeResults = scoreTools(
    { ...user, price: "free" },
    TOOLS
  );

  // ============================
  // 3. RUN ENGINE (ALL TOOLS)
  // ============================

  const allResults = scoreTools(
    { ...user, price: "all" },
    TOOLS
  );

  // ============================
  // 4. MAIN RESULTS (RESPECT USER CHOICE)
  // ============================

  let mainResults;

  if (user.price === "free") {
    mainResults = freeResults.slice(0, 5);
  } else {
    mainResults = allResults.slice(0, 5);
  }

  renderResults(mainResults, user, "results");

  // ============================
  // 5. UPGRADE BLOCK (ONLY IF FREE SELECTED)
  // ============================

  if (user.price === "free") {

    const freeIds = new Set(freeResults.map(t => t.id));

    const paidOnly = allResults.filter(tool =>
      !freeIds.has(tool.id) && tool.price === "paid"
    );

    const upgradeResults = paidOnly.slice(0, 3);

    renderUpgradeResults(upgradeResults, freeResults);

  } else {
    // clear upgrade section if not needed
    document.getElementById("upgrade-results").innerHTML = "";
  }
}


// ==========================================
// RENDER FUNCTION
// ==========================================

// Render results

function renderResults(results, user, containerId = "results") {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  results.forEach((tool, index) => {

    const label = getLabel(tool.percentage);

    const el = document.createElement("div");
    el.className = "result-card";

    // Highlight top result
    if (index === 0) {
      el.classList.add("featured");
    }

    // Features
    const featuresHTML = tool.features
      ?.map(f => `<li>${f}</li>`)
      .join("") || "";

    // Badges
    const badgesHTML = tool.badges
      ?.map(b => `<span class="badge">${b}</span>`)
      .join("") || "";

    const why = getWhyText(user, tool);

    el.innerHTML = `
      <div class="card-header">
        <img src="${tool.logo}" alt="${tool.name} logo" class="tool-logo">
        <h3>${tool.name}</h3>
      </div>

      <div class="score-bar">
        <div class="score-fill" style="width:${tool.percentage}%"></div>
      </div>

      <p><strong>${tool.percentage}% match</strong> — ${label}</p>

      <p class="tagline">${tool.tagline}</p>
      <p class="why-title"><strong>Why this fits you:</strong></p>
       <ul class="why-list">${why.map(r => `<li>${r}</li>`).join("")}</ul>
      <p class="best-for">${tool.bestFor}</p>

      <ul class="features">
        ${featuresHTML}
      </ul>

      ${badgesHTML ? `<div class="badges">${badgesHTML}</div>` : ""}

      <a href="${tool.url}" target="_blank" class="button button-primary">
        Try ${tool.name}
      </a>
    `;

    container.appendChild(el);
  });
}

// Render paid upgrade results

function renderUpgradeResults(results, freeResults) {

  const container = document.getElementById("upgrade-results");
  container.innerHTML = "";

  if (!results.length) return;

  const bestFree = freeResults[0]?.percentage || 0;

  const wrapper = document.createElement("div");
  wrapper.className = "upgrade-box";

  wrapper.innerHTML = `
    <h2 style="margin-bottom:0.5rem;">
      Want better results?
    </h2>
    <p style="margin-bottom:1.5rem; color:var(--text-muted);">
      If you're open to paid tools, you could get significantly better matches.
      Your best free result was <strong>${bestFree}%</strong>.
    </p>
  `;

  results.forEach(tool => {

    const gain = tool.percentage - bestFree;

    const el = document.createElement("div");
    el.className = "result-card";
  
    el.innerHTML = `
  <div class="card-header">
    <img src="${tool.logo}" alt="${tool.name} logo" class="tool-logo">
    <h3>${tool.name}</h3>
  </div>

  <div class="score-bar">
    <div class="score-fill" style="width:${tool.percentage}%"></div>
  </div>

  <p>
    <strong>${tool.percentage}% match</strong>
    ${gain > 0 ? `(+${gain}% better)` : ""}
  </p>

  <p class="tagline">${tool.tagline}</p>
  <p class="best-for">${tool.bestFor}</p>

  <a href="${tool.url}" target="_blank" class="button button-primary">
    Try ${tool.name}
  </a>
`;

    wrapper.appendChild(el);
  });

  container.appendChild(wrapper);
}


// ==========================================
// WHY TEXT
// ==========================================

function getWhyText(user, tool) {

  const task = user.tasks?.[0];
  const level = user.control;

  const parts = [];

  // === TASK MATCH ===
  if (task && tool.capability?.[task]) {
    parts.push(`Strong match for ${task} tasks`);
  }

  // === EASE MATCH ===
  if (user.ease && tool.ease) {
    if (user.ease === tool.ease) {
      if (tool.ease === "easy") {
        parts.push("Very easy to get started with");
      } else if (tool.ease === "medium") {
        parts.push("Balanced between power and ease of use");
      } else {
        parts.push("Powerful with advanced capabilities");
      }
    }
  }

  // === CAPABILITY LEVEL ===
  if (task && level && tool.capability?.[task]) {
    const score = tool.capability[task][level];

    if (score >= 0.85) {
      parts.push("Handles this task extremely well");
    } else if (score >= 0.7) {
      parts.push("Reliably performs this task");
    }
  }

  // === FALLBACK ===
  if (parts.length === 0) {
    return "A solid option based on your preferences.";
  }

  return parts.length > 0
  ? parts
  : ["A solid option based on your preferences."];
}


// ==========================================
// LABELS
// ==========================================
function getLabel(score) {
  if (score >= 90) return "Excellent fit";
  if (score >= 75) return "Great match";
  if (score >= 60) return "Good option";
  return "Less ideal";
}
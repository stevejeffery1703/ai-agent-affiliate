// ==========================================
// RECOMMENDER APP LOGIC
// UI -> scoring engine -> rendered results
// Tool data is injected by the page (from the content collection) into a
// <script type="application/json" id="tools-data"> block.
// ==========================================

import { scoreTools } from './engine.js';

let TOOLS = [];

const controlLabels = {
  1: 'I just want suggestions',
  2: 'Help me decide',
  3: 'Do most of the work',
  4: 'Handle it for me',
};

const easeLabels = {
  1: 'Simple and easy (works out of the box)',
  2: 'Learn a bit (some setup, better results)',
  3: 'Invest time (more complex; most powerful)',
};

export function initRecommender() {
  const runBtn = document.getElementById('runBtn');
  if (!runBtn) return; // not on the recommender page

  const dataEl = document.getElementById('tools-data');
  try {
    TOOLS = dataEl ? JSON.parse(dataEl.textContent) : [];
  } catch {
    TOOLS = [];
  }

  // Icon grid: single-select
  const iconOptions = document.querySelectorAll('.icon-option');
  iconOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      iconOptions.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Slider labels
  const controlSlider = document.getElementById('control');
  const easeSlider = document.getElementById('ease');
  const controlLabel = document.getElementById('control-label');
  const easeLabel = document.getElementById('ease-label');

  controlLabel.textContent = controlLabels[controlSlider.value];
  easeLabel.textContent = easeLabels[easeSlider.value];

  controlSlider.addEventListener('input', () => {
    controlLabel.textContent = controlLabels[controlSlider.value];
  });
  easeSlider.addEventListener('input', () => {
    easeLabel.textContent = easeLabels[easeSlider.value];
  });

  runBtn.addEventListener('click', runRecommendation);
}

function runRecommendation() {
  const activeIcon = document.querySelector('.icon-option.active');

  const user = {
    tasks: [activeIcon ? activeIcon.dataset.value : null],
    control: mapControl(document.getElementById('control').value),
    ease: mapEase(document.getElementById('ease').value),
    price: document.getElementById('price').checked ? 'free' : 'all',
  };

  const freeResults = scoreTools({ ...user, price: 'free' }, TOOLS);
  const allResults = scoreTools({ ...user, price: 'all' }, TOOLS);

  const mainResults = (user.price === 'free' ? freeResults : allResults).slice(0, 4);

  renderResults(mainResults, user, 'results');

  document
    .getElementById('results')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Upsell block only when the user restricted to free tools
  if (user.price === 'free') {
    const freeIds = new Set(freeResults.map((t) => t.id));
    const paidOnly = allResults.filter(
      (tool) => !freeIds.has(tool.id) && tool.price === 'paid'
    );
    renderUpgradeResults(paidOnly.slice(0, 3), freeResults);
  } else {
    document.getElementById('upgrade-results').innerHTML = '';
  }
}

// Logo, or a colored initial when a tool has no logo yet.
function logoHTML(tool) {
  if (tool.logo) {
    return `<img src="${tool.logo}" alt="${tool.name} logo" class="tool-logo">`;
  }
  const initial = (tool.name || '?').trim().charAt(0).toUpperCase();
  const color = tool.accentColor || '#10b981';
  return `<span class="tool-logo tool-logo-fallback" style="background:${color}">${initial}</span>`;
}

function renderResults(results, user, containerId = 'results') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML =
      '<p class="best-for">No tools match those choices yet — try turning off "free only" or picking a different task.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'results-grid';

  results.forEach((tool, index) => {
    const label = getLabel(tool.percentage);
    const el = document.createElement('div');
    el.className = 'result-card';
    if (index === 0) el.classList.add('featured');

    const featuresHTML = tool.features?.map((f) => `<li>${f}</li>`).join('') || '';
    const badgesHTML = tool.badges?.map((b) => `<span class="badge">${b}</span>`).join('') || '';
    const why = getWhyText(user, tool);
    const priceHTML = tool.priceLabel ? `<p class="price">${tool.priceLabel}</p>` : '';

    el.innerHTML = `
      ${index === 0 ? '<span class="featured-badge">Top match</span>' : ''}
      <div class="card-header">
        ${logoHTML(tool)}
        <h3>${tool.name}</h3>
      </div>
      <div class="score-bar"><div class="score-fill" style="width:${tool.percentage}%"></div></div>
      <p><strong>${tool.percentage}% match</strong> &bull; ${label}</p>
      <p class="tagline">${tool.tagline}</p>
      ${priceHTML}
      <p class="why-title"><strong>Why this fits you:</strong></p>
      <ul class="why-list">${why.map((r) => `<li>${r}</li>`).join('')}</ul>
      <p class="best-for">${tool.bestFor}</p>
      <ul class="features">${featuresHTML}</ul>
      ${badgesHTML ? `<div class="badges">${badgesHTML}</div>` : ''}
      <a href="${tool.url}" target="_blank" rel="sponsored noopener" class="button button-primary">Try ${tool.name}</a>
    `;

    grid.appendChild(el);
  });

  container.appendChild(grid);
}

function renderUpgradeResults(results, freeResults) {
  const container = document.getElementById('upgrade-results');
  container.innerHTML = '';
  if (!results.length) return;

  const bestFree = freeResults[0]?.percentage || 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'upgrade-box';
  wrapper.innerHTML = `
    <h2 style="margin-bottom:0.5rem;">Want better results?</h2>
    <p style="margin-bottom:1.5rem; color:var(--text-muted);">
      If you're open to paid tools, you could get significantly better matches.
      Your best free result was <strong>${bestFree}%</strong>.
    </p>
  `;

  const grid = document.createElement('div');
  grid.className = 'results-grid upgrade-grid';

  results.forEach((tool) => {
    const gain = tool.percentage - bestFree;
    const priceHTML = tool.priceLabel ? `<p class="price">${tool.priceLabel}</p>` : '';
    const el = document.createElement('div');
    el.className = 'result-card';
    el.innerHTML = `
      <div class="card-header">
        ${logoHTML(tool)}
        <h3>${tool.name}</h3>
      </div>
      <div class="score-bar"><div class="score-fill" style="width:${tool.percentage}%"></div></div>
      <p><strong>${tool.percentage}% match</strong> ${gain > 0 ? `(+${gain}% better)` : ''}</p>
      <p class="tagline">${tool.tagline}</p>
      ${priceHTML}
      <p class="best-for">${tool.bestFor}</p>
      <a href="${tool.url}" target="_blank" rel="sponsored noopener" class="button button-primary">Try ${tool.name}</a>
    `;
    grid.appendChild(el);
  });

  wrapper.appendChild(grid);
  container.appendChild(wrapper);
}

function getWhyText(user, tool) {
  const task = user.tasks?.[0];
  const level = user.control;
  const parts = [];

  if (task && tool.capability?.[task]) {
    parts.push(`Strong match for ${task} tasks`);
  }

  if (user.ease && tool.ease && user.ease === tool.ease) {
    if (tool.ease === 'easy') parts.push('Very easy to get started with');
    else if (tool.ease === 'medium') parts.push('Balanced between power and ease of use');
    else parts.push('Powerful with advanced capabilities');
  }

  if (task && level && tool.capability?.[task]) {
    const score = tool.capability[task][String(level)];
    if (score >= 0.85) parts.push('Handles this task extremely well');
    else if (score >= 0.7) parts.push('Reliably performs this task');
  }

  return parts.length ? parts : ['A solid option based on your preferences.'];
}

function getLabel(score) {
  if (score >= 90) return 'Excellent fit';
  if (score >= 75) return 'Great match';
  if (score >= 60) return 'Good option';
  return 'Less ideal';
}

function mapControl(value) {
  const map = { 1: 1, 2: 2, 3: 3, 4: 4 };
  return map[value] || 2;
}

function mapEase(value) {
  const map = { 1: 'easy', 2: 'medium', 3: 'advanced' };
  return map[value] || 'easy';
}

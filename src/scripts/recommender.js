// ==========================================
// RECOMMENDER APP LOGIC
// UI -> scoring engine -> rendered results
// Tool data is injected by the page (from the content collection) into a
// <script type="application/json" id="tools-data"> block.
// ==========================================

import { shortlist, assignRoles, buildReasons, CONTROL_SCOPE } from './engine.js';

let TOOLS = [];

// How many runners-up to show before handing off to the directory. Keeps the
// page readable now and bounded as the collection grows.
const RUNNERS_SHOWN = 6;


// Authored content is trusted, but it still goes through innerHTML — an
// apostrophe or angle bracket in a tagline shouldn't be able to break markup.
function esc(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

// Read the selected value out of one group of segmented buttons.
function selected(group) {
  const el = document.querySelector(`[data-group="${group}"][aria-pressed="true"]`);
  return el ? el.dataset.value : null;
}

export function initRecommender() {
  const form = document.getElementById('recommender');
  if (!form) return; // not on the recommender page

  const dataEl = document.getElementById('tools-data');
  try {
    TOOLS = dataEl ? JSON.parse(dataEl.textContent) : [];
  } catch {
    TOOLS = [];
  }

  // One handler for every control: each group is single-select, and any change
  // re-renders immediately. No submit button — the results sit beside the
  // controls, so there's nothing to "run" and nothing to scroll to.
  form.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-group]');
    if (!btn) return;
    const group = btn.dataset.group;
    form
      .querySelectorAll(`[data-group="${group}"]`)
      .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    run();
  });

  run(); // populate on load — an empty results column would be a dead page
}

function run() {
  const user = {
    task: selected('task'),
    control: Number(selected('control')) || 2,
    ease: selected('ease') || 'easy',
    freeOnly: selected('price') === 'free',
  };

  renderResults(user);

  // The upsell only makes sense when they've restricted themselves to free.
  if (user.freeOnly) renderUpgrade(user);
  else document.getElementById('upgrade-results').innerHTML = '';
}

// Logo, or a colored initial when a tool has no logo yet.
function logoHTML(tool) {
  if (tool.logo) {
    return `<img src="${esc(tool.logo)}" alt="" class="tool-logo">`;
  }
  const initial = (tool.name || '?').trim().charAt(0).toUpperCase();
  const color = tool.accentColor || '#10b981';
  return `<span class="tool-logo tool-logo-fallback" style="background:${esc(color)}">${esc(initial)}</span>`;
}

// Provenance: when we last checked, and what we checked against. This is the
// site's whole claim to independence, so it belongs on the card, not just on
// the About page.
function provenanceHTML(tool) {
  const sources = tool.sources?.length
    ? `<details class="pick-sources">
         <summary>${tool.sources.length} source${tool.sources.length > 1 ? 's' : ''}</summary>
         <ul>${tool.sources
           .map(
             (s) =>
               `<li><a href="${esc(s)}" target="_blank" rel="noopener nofollow">${esc(
                 new URL(s).hostname.replace(/^www\./, '')
               )}</a></li>`
           )
           .join('')}</ul>
       </details>`
    : '';
  const affiliate = tool.isAffiliate
    ? '<span class="pick-disclosure" title="We may earn a commission. It does not affect ranking.">affiliate link</span>'
    : '';
  return `<p class="pick-meta">
      ${tool.priceLabel ? `<span>${esc(tool.priceLabel)}</span>` : ''}
      <span>Verified ${esc(tool.verified)}</span>
      ${sources}
      ${affiliate}
    </p>`;
}

function reasonsHTML(reasons) {
  const main = reasons.filter((r) => r.kind !== 'caveat');
  const caveat = reasons.find((r) => r.kind === 'caveat');
  return `
    <ul class="pick-reasons">
      ${main.map((r) => `<li class="reason-${r.kind}">${esc(r.text)}</li>`).join('')}
    </ul>
    ${caveat ? `<p class="pick-caveat"><strong>Worth knowing:</strong> ${esc(caveat.text)}</p>` : ''}
  `;
}

function pickHTML(entry, ranked, user, isPrimary, shownIds) {
  const { tool, role } = entry;
  const scope = isPrimary
    ? `<p class="pick-scope">For ${esc(user.task)}, when ${esc(CONTROL_SCOPE[user.control])}.</p>`
    : '';
  return `
    <article class="pick${isPrimary ? ' pick-primary' : ''}">
      <span class="pick-role">${esc(role)}</span>
      <div class="pick-head">
        ${logoHTML(tool)}
        <h3>${esc(tool.name)}</h3>
      </div>
      ${scope}
      <p class="pick-tagline">${esc(tool.tagline)}</p>
      ${reasonsHTML(buildReasons(entry, ranked, user, shownIds))}
      ${provenanceHTML(tool)}
      <div class="pick-actions">
        <a href="${esc(tool.url)}" target="_blank" rel="sponsored noopener" class="button button-primary">
          Visit ${esc(tool.name)}
        </a>
        <a href="/tools/${esc(tool.id)}" class="button button-secondary">Read our take</a>
      </div>
    </article>
  `;
}

function renderResults(user) {
  const container = document.getElementById('results');

  if (!user.task) {
    container.innerHTML = '<p class="rec-empty">Pick a task above to see recommendations.</p>';
    return;
  }

  const { ranked, capableN, eligibleN } = shortlist(user, TOOLS);

  if (!ranked.length) {
    container.innerHTML = `<p class="rec-empty">
        None of the ${capableN} ${esc(user.task)} tools we track have a free plan.
        Turn off &ldquo;free only&rdquo; to see them.
      </p>`;
    return;
  }

  const { roles, ties } = assignRoles(ranked, user);
  const shown = new Set(roles.map((r) => r.tool.id));
  const runners = ranked.filter((t) => !shown.has(t.id));
  // Anything already visible as a pick or a named tie shouldn't be re-offered
  // as the "pick this instead" contrast.
  const shownIds = new Set([...shown, ...ties.map((t) => t.id)]);

  // Honest framing of the shortlist: what we looked at, and what got filtered.
  const filtered =
    user.freeOnly && eligibleN < capableN
      ? ` <span class="rec-filter">${eligibleN} of them have a free plan.</span>`
      : '';

  const tiesHTML = ties.length
    ? `<p class="rec-ties">Too close to call between our pick and
         ${ties.map((t) => esc(t.name)).join(' and ')} — any of them would serve you well.</p>`
    : '';

  const runnersHTML = runners.length
    ? `<div class="runners">
         <h3 class="runners-title">Also considered</h3>
         <div class="runners-grid">
           ${runners
             .slice(0, RUNNERS_SHOWN)
             .map(
               // Runners-up go to our own page, not straight off-site: these are
               // lower-intent clicks where the useful next step is reading, not
               // signing up.
               (t) => `
             <a class="runner" href="/tools/${esc(t.id)}">
               ${logoHTML(t)}
               <span class="runner-info">
                 <span class="runner-name">${esc(t.name)}</span>
                 <span class="runner-best">${esc(t.bestFor)}</span>
               </span>
             </a>`
             )
             .join('')}
         </div>
         ${
           runners.length > RUNNERS_SHOWN
             ? `<p class="runners-more">
                  + ${runners.length - RUNNERS_SHOWN} more we compared —
                  <a href="/tools">browse all ${TOOLS.length} tools</a>.
                </p>`
             : ''
         }
       </div>`
    : '';

  container.innerHTML = `
    <p class="rec-summary">
      We compared <strong>${capableN}</strong> tools that do ${esc(user.task)}.${filtered}
      <a href="/about">How we choose</a>
    </p>
    <div class="picks">
      ${roles.map((r, i) => pickHTML(r, ranked, user, i === 0, shownIds)).join('')}
    </div>
    ${tiesHTML}
    ${runnersHTML}
  `;
}

// What they'd gain by lifting the free-only restriction — framed as a real
// comparison, not a score delta.
function renderUpgrade(user) {
  const container = document.getElementById('upgrade-results');
  container.innerHTML = '';

  const free = shortlist({ ...user, freeOnly: true }, TOOLS).ranked;
  const all = shortlist({ ...user, freeOnly: false }, TOOLS).ranked;
  if (!free.length || !all.length) return;

  const bestFree = free[0];
  const betterPaid = all.filter((t) => !t.isFree && t.score > bestFree.score).slice(0, 2);
  if (!betterPaid.length) return;

  container.innerHTML = `
    <div class="upgrade-box">
      <h2>If you'd consider paying</h2>
      <p class="upgrade-intro">
        ${betterPaid.length === 1 ? 'One paid tool scores' : 'These paid tools score'}
        higher for what you asked for than the best free option
        (<strong>${esc(bestFree.name)}</strong>).
      </p>
      <div class="runners-grid">
        ${betterPaid
          .map(
            (t) => `
          <a class="runner" href="/tools/${esc(t.id)}">
            ${logoHTML(t)}
            <span class="runner-info">
              <span class="runner-name">${esc(t.name)}</span>
              <span class="runner-best">${esc(t.bestFor)}</span>
            </span>
          </a>`
          )
          .join('')}
      </div>
    </div>
  `;
}


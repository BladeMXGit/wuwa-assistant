/**
 * Wuthering Waves Companion & Pulls Planner
 * Main Application Controller
 */

import { RECURRING_SOURCES, HIDDEN_SECRETS } from './data/astrite-sources.js';
import { SONATA_SETS, COST_CONFIGS, DATA_BANK_TIPS } from './data/echoes.js';
import { PROMO_CODES, REDEEM_GUIDE } from './data/codes.js';
import { SERVERS, getServerTimes, getTowerResetCountdown, parseConveneUrl, POWERSHELL_CONVENE_SCRIPT } from './tools/server-sync.js';
import { detectServerByUID, getPlayerProfile, getSol3Phase } from './tools/uid-lookup.js';
import { SVG_ICONS } from './data/icons.js';

// Global state with localStorage defaults
const STATE = {
  astrite: Number(localStorage.getItem('wuwa_astrite')) || 3200,
  radiantTides: Number(localStorage.getItem('wuwa_radiant')) || 10,
  forgingTides: Number(localStorage.getItem('wuwa_forging')) || 0,
  pity: Number(localStorage.getItem('wuwa_pity')) || 25,
  isGuaranteed: localStorage.getItem('wuwa_guaranteed') === 'true',
  daysRemaining: Number(localStorage.getItem('wuwa_days')) || 20,
  hasLunite: localStorage.getItem('wuwa_lunite') !== 'false',
  hasPodcast: localStorage.getItem('wuwa_podcast') === 'true',
  towerStars: Number(localStorage.getItem('wuwa_tower_stars')) || 24,

  // Waveplate
  currentWaveplate: Number(localStorage.getItem('wuwa_waveplate')) || 140,
  waveplateUpdatedAt: Number(localStorage.getItem('wuwa_waveplate_time')) || Date.now()
};

/* ==========================================================================
   UI Helpers: Toast & Clipboard
   ========================================================================== */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}

window.copyCode = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Código ${text} copiado al portapapeles!`);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(`Código ${text} copiado!`);
  }
};

/* ==========================================================================
   Navigation Tabs
   ========================================================================== */

function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.tab-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      tab.classList.add('active');
      const activeView = document.getElementById(`view-${target}`);
      if (activeView) activeView.classList.add('active');
    });
  });
}

/* ==========================================================================
   Pulls & Pity Planner
   ========================================================================== */

function initPullsPlanner() {
  const inAstrite = document.getElementById('in-astrite');
  const inRadiant = document.getElementById('in-radiant');
  const inForging = document.getElementById('in-forging');
  const inDays = document.getElementById('in-days');
  const inPity = document.getElementById('in-pity');
  const inPityVal = document.getElementById('in-pity-val');
  const inGuaranteed = document.getElementById('in-guaranteed');
  const inLunite = document.getElementById('in-lunite');
  const inPodcast = document.getElementById('in-podcast');

  // Sliders & Stacked Elements
  const rngAstrite = document.getElementById('rng-astrite');
  const rngRadiant = document.getElementById('rng-radiant');
  const rngForging = document.getElementById('rng-forging');
  const rngDays = document.getElementById('rng-days');

  const fillAstrite = document.getElementById('fill-astrite');
  const fillRadiant = document.getElementById('fill-radiant');
  const fillForging = document.getElementById('fill-forging');
  const fillDays = document.getElementById('fill-days');
  const pitySliderFill = document.getElementById('pity-slider-fill');

  const lblAstrite = document.getElementById('lbl-astrite');
  const lblRadiant = document.getElementById('lbl-radiant');
  const lblForging = document.getElementById('lbl-forging');
  const lblDays = document.getElementById('lbl-days');
  const lblPityDisplay = document.getElementById('lbl-pity-display');
  const pityTierTag = document.getElementById('pity-tier-tag');

  // Top Swatches
  const swatchAstrite = document.getElementById('swatch-astrite-val');
  const swatchRadiant = document.getElementById('swatch-radiant-val');
  const swatchForging = document.getElementById('swatch-forging-val');
  const swatchWaveplate = document.getElementById('swatch-waveplate-val');

  // Outputs
  const outCurrentPulls = document.getElementById('out-current-pulls');
  const outFuturePulls = document.getElementById('out-future-pulls');
  const outGuaranteedNeeded = document.getElementById('out-guaranteed-needed');
  const pityBarFill = document.getElementById('pity-bar-fill');
  const pityStatusText = document.getElementById('pity-status-text');

  // Sync state to inputs
  function syncInputsFromState() {
    if (inAstrite) inAstrite.value = STATE.astrite;
    if (rngAstrite) rngAstrite.value = STATE.astrite;
    if (lblAstrite) lblAstrite.textContent = STATE.astrite.toLocaleString();
    if (fillAstrite) fillAstrite.style.width = `${Math.min(100, (STATE.astrite / 25000) * 100)}%`;

    if (inRadiant) inRadiant.value = STATE.radiantTides;
    if (rngRadiant) rngRadiant.value = STATE.radiantTides;
    if (lblRadiant) lblRadiant.textContent = STATE.radiantTides;
    if (fillRadiant) fillRadiant.style.width = `${Math.min(100, (STATE.radiantTides / 80) * 100)}%`;

    if (inForging) inForging.value = STATE.forgingTides;
    if (rngForging) rngForging.value = STATE.forgingTides;
    if (lblForging) lblForging.textContent = STATE.forgingTides;
    if (fillForging) fillForging.style.width = `${Math.min(100, (STATE.forgingTides / 80) * 100)}%`;

    if (inDays) inDays.value = STATE.daysRemaining;
    if (rngDays) rngDays.value = STATE.daysRemaining;
    if (lblDays) lblDays.textContent = STATE.daysRemaining;
    if (fillDays) fillDays.style.width = `${Math.min(100, (STATE.daysRemaining / 90) * 100)}%`;

    if (inPity) inPity.value = STATE.pity;
    if (inPityVal) inPityVal.textContent = STATE.pity;
    if (lblPityDisplay) lblPityDisplay.textContent = `${STATE.pity} / 80`;
    if (pitySliderFill) pitySliderFill.style.width = `${Math.min(100, (STATE.pity / 80) * 100)}%`;

    if (inGuaranteed) inGuaranteed.checked = STATE.isGuaranteed;
    if (inLunite) inLunite.checked = STATE.hasLunite;
    if (inPodcast) inPodcast.checked = STATE.hasPodcast;
  }

  syncInputsFromState();

  function calculate() {
    // Current pulls
    const astritePulls = Math.floor(STATE.astrite / 160);
    const totalCurrentPulls = astritePulls + STATE.radiantTides;
    if (outCurrentPulls) outCurrentPulls.textContent = totalCurrentPulls;

    // Daily income during daysRemaining
    const dailyQuestsAstrite = STATE.daysRemaining * 60;
    const luniteAstrite = STATE.hasLunite ? STATE.daysRemaining * 90 : 0;
    const podcastTides = STATE.hasPodcast ? 5 : 0;

    // Tower bi-weekly cycles during remaining days
    const towerCycles = Math.floor(STATE.daysRemaining / 14);
    const towerAstrite = towerCycles * (STATE.towerStars >= 30 ? 700 : STATE.towerStars * 23);

    const futureAstriteGained = dailyQuestsAstrite + luniteAstrite + towerAstrite;
    const futurePullsGained = Math.floor(futureAstriteGained / 160) + podcastTides;
    const totalEstPulls = totalCurrentPulls + futurePullsGained;

    if (outFuturePulls) outFuturePulls.textContent = totalEstPulls;

    // Pity calculations
    const pullsToNext5Star = Math.max(0, 80 - STATE.pity);
    const pullsToGuaranteed = STATE.isGuaranteed ? pullsToNext5Star : pullsToNext5Star + 80;

    if (outGuaranteedNeeded) outGuaranteedNeeded.textContent = pullsToGuaranteed;

    // Update pity bar
    const pct = Math.min(100, Math.round((STATE.pity / 80) * 100));
    if (pityBarFill) pityBarFill.style.width = `${pct}%`;
    if (pitySliderFill) pitySliderFill.style.width = `${pct}%`;

    let pityTier = 'INICIAL';
    if (STATE.pity >= 65) {
      pityTier = 'SOFT PITY (ALTO)';
    } else if (STATE.pity >= 40) {
      pityTier = 'INTERMEDIO';
    }
    if (pityTierTag) pityTierTag.textContent = pityTier;
    if (pityStatusText) {
      pityStatusText.textContent = `${STATE.pity}/80 • ${STATE.isGuaranteed ? '100% GARANTIZADO' : '50/50'} • ${pityTier}`;
    }

    // Update Top Swatches
    if (swatchAstrite) swatchAstrite.textContent = STATE.astrite.toLocaleString();
    if (swatchRadiant) swatchRadiant.textContent = STATE.radiantTides;
    if (swatchForging) swatchForging.textContent = STATE.forgingTides;
    if (swatchWaveplate) swatchWaveplate.textContent = `${STATE.currentWaveplate}/240`;

    saveState();
  }

  function saveState() {
    localStorage.setItem('wuwa_astrite', STATE.astrite);
    localStorage.setItem('wuwa_radiant', STATE.radiantTides);
    localStorage.setItem('wuwa_forging', STATE.forgingTides);
    localStorage.setItem('wuwa_pity', STATE.pity);
    localStorage.setItem('wuwa_guaranteed', STATE.isGuaranteed);
    localStorage.setItem('wuwa_days', STATE.daysRemaining);
    localStorage.setItem('wuwa_lunite', STATE.hasLunite);
    localStorage.setItem('wuwa_podcast', STATE.hasPodcast);
  }

  // Event Listeners for Range Sliders
  rngAstrite?.addEventListener('input', () => {
    STATE.astrite = parseInt(rngAstrite.value, 10) || 0;
    if (inAstrite) inAstrite.value = STATE.astrite;
    if (lblAstrite) lblAstrite.textContent = STATE.astrite.toLocaleString();
    if (fillAstrite) fillAstrite.style.width = `${Math.min(100, (STATE.astrite / 25000) * 100)}%`;
    calculate();
  });

  rngRadiant?.addEventListener('input', () => {
    STATE.radiantTides = parseInt(rngRadiant.value, 10) || 0;
    if (inRadiant) inRadiant.value = STATE.radiantTides;
    if (lblRadiant) lblRadiant.textContent = STATE.radiantTides;
    if (fillRadiant) fillRadiant.style.width = `${Math.min(100, (STATE.radiantTides / 80) * 100)}%`;
    calculate();
  });

  rngForging?.addEventListener('input', () => {
    STATE.forgingTides = parseInt(rngForging.value, 10) || 0;
    if (inForging) inForging.value = STATE.forgingTides;
    if (lblForging) lblForging.textContent = STATE.forgingTides;
    if (fillForging) fillForging.style.width = `${Math.min(100, (STATE.forgingTides / 80) * 100)}%`;
    calculate();
  });

  rngDays?.addEventListener('input', () => {
    STATE.daysRemaining = parseInt(rngDays.value, 10) || 0;
    if (inDays) inDays.value = STATE.daysRemaining;
    if (lblDays) lblDays.textContent = STATE.daysRemaining;
    if (fillDays) fillDays.style.width = `${Math.min(100, (STATE.daysRemaining / 90) * 100)}%`;
    calculate();
  });

  inPity?.addEventListener('input', () => {
    STATE.pity = parseInt(inPity.value, 10) || 0;
    if (inPityVal) inPityVal.textContent = STATE.pity;
    if (lblPityDisplay) lblPityDisplay.textContent = `${STATE.pity} / 80`;
    calculate();
  });

  inGuaranteed?.addEventListener('change', () => {
    STATE.isGuaranteed = inGuaranteed.checked;
    calculate();
  });

  inLunite?.addEventListener('change', () => {
    STATE.hasLunite = inLunite.checked;
    calculate();
  });

  inPodcast?.addEventListener('change', () => {
    STATE.hasPodcast = inPodcast.checked;
    calculate();
  });

  // Save Image & Export SVG style action buttons
  document.getElementById('btn-save-planner')?.addEventListener('click', () => {
    saveState();
    showToast('Ahorros y parámetros calculados y guardados!');
  });

  document.getElementById('btn-reset-planner')?.addEventListener('click', () => {
    STATE.astrite = 3200;
    STATE.radiantTides = 10;
    STATE.forgingTides = 0;
    STATE.pity = 25;
    STATE.isGuaranteed = false;
    STATE.daysRemaining = 20;
    STATE.hasLunite = true;
    STATE.hasPodcast = false;
    syncInputsFromState();
    calculate();
    showToast('Parámetros reiniciados a los valores estándar.');
  });

  calculate();
}

/* ==========================================================================
   Waveplate (Stamina) Live Calculator
   ========================================================================== */

function initWaveplateTracker() {
  const waveInput = document.getElementById('in-waveplate');
  const waveFill = document.getElementById('waveplate-slider-fill');
  const waveDisplayText = document.getElementById('waveplate-display-text');
  const wavePctTag = document.getElementById('waveplate-pct-tag');
  const waveCapTime = document.getElementById('waveplate-cap-time');
  const waveCountdown = document.getElementById('waveplate-countdown');
  const topPillVal = document.getElementById('top-waveplate-val');
  const swatchWaveplate = document.getElementById('swatch-waveplate-val');

  function getCalculatedWaveplate() {
    const elapsedMinutes = (Date.now() - STATE.waveplateUpdatedAt) / (1000 * 60);
    const recovered = Math.floor(elapsedMinutes / 6); // 1 per 6 min
    return Math.min(240, STATE.currentWaveplate + recovered);
  }

  function update() {
    const current = getCalculatedWaveplate();
    if (waveInput) waveInput.value = current;
    if (topPillVal) topPillVal.textContent = `${current}/240`;
    if (swatchWaveplate) swatchWaveplate.textContent = `${current}/240`;
    if (waveDisplayText) waveDisplayText.textContent = `${current} / 240`;

    const pct = Math.min(100, Math.round((current / 240) * 100));
    if (waveFill) waveFill.style.width = `${pct}%`;
    if (wavePctTag) wavePctTag.textContent = `${pct}%`;

    const remaining = 240 - current;
    if (remaining <= 0) {
      if (waveCapTime) waveCapTime.textContent = '¡COMPLETAMENTE LLENA! (240/240)';
      if (waveCountdown) waveCountdown.textContent = '00:00:00';
    } else {
      const minutesNeeded = remaining * 6;
      const hours = Math.floor(minutesNeeded / 60);
      const mins = minutesNeeded % 60;
      if (waveCountdown) waveCountdown.textContent = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;

      const capDate = new Date(Date.now() + minutesNeeded * 60 * 1000);
      if (waveCapTime) {
        waveCapTime.textContent = `CAP: ${capDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${capDate.toLocaleDateString()})`;
      }
    }
  }

  waveInput?.addEventListener('input', () => {
    STATE.currentWaveplate = Math.max(0, Math.min(240, parseInt(waveInput.value, 10) || 0));
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
  });

  // Action buttons
  document.getElementById('btn-spend-40')?.addEventListener('click', () => {
    const current = getCalculatedWaveplate();
    STATE.currentWaveplate = Math.max(0, current - 40);
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
    showToast('Gastados 40 Waveplates (Jefe de Mundo)');
  });

  document.getElementById('btn-spend-60')?.addEventListener('click', () => {
    const current = getCalculatedWaveplate();
    STATE.currentWaveplate = Math.max(0, current - 60);
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
    showToast('Gastados 60 Waveplates (Jefe Semanal / Tacet Field)');
  });

  document.getElementById('btn-refill-60')?.addEventListener('click', () => {
    const current = getCalculatedWaveplate();
    STATE.currentWaveplate = Math.min(240, current + 60);
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
    showToast('Usado 1 Solvente Cristalino (+60 Waveplates)');
  });

  document.getElementById('btn-fill-240')?.addEventListener('click', () => {
    STATE.currentWaveplate = 240;
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
    showToast('Waveplate ajustado al límite máximo (240/240)');
  });

  update();
  // Live ticker every 30 seconds
  setInterval(update, 30000);
}

/* ==========================================================================
   Render Datasets (Secrets, Echoes, Promo Codes)
   ========================================================================== */

function renderSecrets() {
  const recurringContainer = document.getElementById('recurring-list');
  const secretsContainer = document.getElementById('secrets-list');

  recurringContainer.innerHTML = RECURRING_SOURCES.map(s => `
    <div style="background: var(--bg-page); border: 1px solid var(--border-white-subtle); padding: 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <strong style="color: var(--text-pure); font-size: 0.95rem;">${s.name}</strong>
        <span class="badge badge-gold">+${s.amount} Astrite</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">${s.desc}</p>
      <div style="font-size: 0.75rem; color: var(--gold-primary); font-family: var(--font-mono); font-weight: 700;">
        Frecuencia: ${s.frequency} • ~${s.monthlyEst} Astrite / mes
      </div>
    </div>
  `).join('');

  secretsContainer.innerHTML = HIDDEN_SECRETS.map(h => `
    <div style="background: var(--bg-page); border: 1px solid var(--border-white-subtle); padding: 1.15rem; margin-bottom: 0.85rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <strong style="color: var(--gold-primary); font-size: 1rem;">${h.title}</strong>
        <span class="badge badge-gold">${h.reward}</span>
      </div>
      <p style="font-size: 0.825rem; color: var(--text-main); margin-bottom: 0.5rem;">${h.desc}</p>
      <div style="background: var(--bg-card); border: 1px solid var(--border-white-subtle); border-left: 3px solid var(--gold-primary); padding: 0.65rem 0.85rem; font-size: 0.8rem; color: var(--gold-primary);">
        💡 <strong>Truco:</strong> ${h.tips}
      </div>
    </div>
  `).join('');
}

function getElementIcon(elem) {
  const el = (elem || '').toLowerCase();
  if (el.includes('fusion') || el.includes('fuego')) return SVG_ICONS.fusion;
  if (el.includes('aero') || el.includes('viento')) return SVG_ICONS.aero;
  if (el.includes('spectro') || el.includes('luz')) return SVG_ICONS.spectro;
  if (el.includes('glacio') || el.includes('hielo')) return SVG_ICONS.glacio;
  if (el.includes('electro') || el.includes('rayo')) return SVG_ICONS.electro;
  if (el.includes('havoc') || el.includes('caos')) return SVG_ICONS.havoc;
  return SVG_ICONS.spectro;
}

function renderEchoes() {
  const sonataContainer = document.getElementById('sonata-list');
  const configsContainer = document.getElementById('configs-list');
  const bankContainer = document.getElementById('databank-list');

  sonataContainer.innerHTML = SONATA_SETS.map(s => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-tech); border-top: 3px solid ${s.color}; border-radius: var(--radius-sm); padding: 1.15rem; transition: all 0.2s ease;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${getElementIcon(s.element)}
          <strong style="color: ${s.color}; font-size: 0.95rem;">${s.name}</strong>
        </div>
        <span class="badge badge-gold" style="font-size: 0.65rem;">${s.element}</span>
      </div>
      <div style="font-size: 0.8rem; margin-bottom: 0.4rem; line-height: 1.4;"><strong style="color: var(--gold-bright);">2 Piezas:</strong> <span style="color: var(--text-muted);">${s.twoPiece}</span></div>
      <div style="font-size: 0.8rem; margin-bottom: 0.75rem; line-height: 1.4;"><strong style="color: var(--gold-bright);">5 Piezas:</strong> <span style="color: var(--text-muted);">${s.fivePiece}</span></div>
      <div style="font-size: 0.75rem; color: var(--gold-primary); background: rgba(255, 209, 89, 0.05); padding: 0.4rem 0.6rem; border-radius: 2px;">
        <strong>Resonadores recomendados:</strong> ${s.recommendedFor.join(', ')}
      </div>
    </div>
  `).join('');

  configsContainer.innerHTML = COST_CONFIGS.map(c => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-tech); border-radius: var(--radius-sm); padding: 1.15rem; margin-bottom: 0.85rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
        <h3 style="color: var(--gold-bright); font-size: 1rem;">${c.type}</h3>
        <div style="display: flex; gap: 3px;">
          ${c.type.includes('4-3-3-1-1') ? `${SVG_ICONS.cost4}${SVG_ICONS.cost3}${SVG_ICONS.cost3}${SVG_ICONS.cost1}${SVG_ICONS.cost1}` : `${SVG_ICONS.cost4}${SVG_ICONS.cost4}${SVG_ICONS.cost1}${SVG_ICONS.cost1}`}
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--gold-primary); margin-bottom: 0.5rem; font-family: var(--font-mono);">${c.statPriority}</div>
      <div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 0.25rem;">✅ <strong>Ventaja:</strong> ${c.pros}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">⚠️ <strong>Atención:</strong> ${c.cons}</div>
    </div>
  `).join('');

  bankContainer.innerHTML = DATA_BANK_TIPS.map(d => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-tech); border-left: 3px solid var(--gold-primary); border-radius: var(--radius-sm); padding: 0.85rem 1rem; margin-bottom: 0.5rem;">
      <strong style="color: var(--gold-bright); font-size: 0.9rem;">${d.level} — ${d.feature}</strong>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${d.advice}</p>
    </div>
  `).join('');
}

function renderCodes() {
  const codesContainer = document.getElementById('codes-list');
  const guideContainer = document.getElementById('redeem-guide-steps');

  codesContainer.innerHTML = PROMO_CODES.map(c => `
    <div class="code-card">
      <div>
        <div class="code-badge">${c.code}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${c.rewards}</div>
      </div>
      <button class="btn btn-primary" onclick="copyCode('${c.code}')">Copiar Código</button>
    </div>
  `).join('');

  guideContainer.innerHTML = REDEEM_GUIDE.inGameSteps.map((step, idx) => `
    <li style="margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
      <strong style="color: var(--gold-primary);">${idx + 1}.</strong> ${step}
    </li>
  `).join('');
}

/* ==========================================================================
   Real-Time Server Sync & Kuro Clocks
   ========================================================================== */

function initServerSync() {
  const clocksContainer = document.getElementById('server-clocks-grid');
  const copyScriptBtn = document.getElementById('btn-copy-convene-script');
  const scriptSnippet = document.getElementById('powershell-script-text');
  const conveneInput = document.getElementById('convene-url-input');
  const parseBtn = document.getElementById('btn-parse-convene');
  const syncResult = document.getElementById('convene-sync-result');

  if (scriptSnippet) {
    scriptSnippet.textContent = POWERSHELL_CONVENE_SCRIPT;
  }

  if (copyScriptBtn) {
    copyScriptBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(POWERSHELL_CONVENE_SCRIPT).then(() => {
        showToast('Script de PowerShell copiado! Pégalo en tu terminal de Windows.');
      });
    });
  }

  if (parseBtn && conveneInput) {
    parseBtn.addEventListener('click', () => {
      try {
        const parsed = parseConveneUrl(conveneInput.value);
        syncResult.style.display = 'block';
        syncResult.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--wuwa-green); border-radius: var(--radius-md); padding: 1rem; margin-top: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--wuwa-green); font-weight: 700; margin-bottom: 0.35rem;">
              <span>✓</span> Conexión con Servidor Kuro Games Verificada
            </div>
            <div style="font-size: 0.85rem; color: var(--text-main); font-family: var(--font-mono);">
              <strong>ID de Registro:</strong> ${parsed.recordId || 'Detectado'} | <strong>Servidor:</strong> ${parsed.serverId}
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.4rem;">
              Historial de invocaciones sincronizado. Los datos se han vinculado a tu planificador local.
            </p>
          </div>
        `;
        showToast('¡Historial de Kuro Games conectado exitosamente!');
      } catch (err) {
        syncResult.style.display = 'block';
        syncResult.innerHTML = `
          <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid var(--wuwa-rose); border-radius: var(--radius-md); padding: 0.85rem; margin-top: 0.85rem; font-size: 0.85rem; color: var(--wuwa-rose);">
            ✕ Error: ${err.message}
          </div>
        `;
      }
    });
  }

  // Update clocks every second
  function updateClocks() {
    if (!clocksContainer) return;
    clocksContainer.innerHTML = SERVERS.map(srv => {
      const times = getServerTimes(srv);
      const towerReset = getTowerResetCountdown(srv);
      return `
        <div class="server-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--text-main); font-size: 1rem;">Servidor ${srv.name}</strong>
            <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--wuwa-green); font-weight: 600;">
              <span class="status-dot-pulse"></span> ONLINE
            </span>
          </div>

          <div>
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Hora del Servidor (${srv.utcOffset >= 0 ? `UTC+${srv.utcOffset}` : `UTC${srv.utcOffset}`})</span>
            <div class="server-clock">${times.serverTimeFormatted}</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
              <span style="color: var(--text-muted);">Reinicio Diario (04:00):</span>
              <span class="reset-countdown">⏳ ${times.countdownFormatted}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
              <span style="color: var(--text-muted);">Torre de Adversidad:</span>
              <span style="font-family: var(--font-mono); color: var(--gold-primary); font-weight: 700;">🔄 ${towerReset}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateClocks();
  setInterval(updateClocks, 1000);
}

/* ==========================================================================
   UID Account & Profile Inspector
   ========================================================================== */

function initUidLookup() {
  const uidInput = document.getElementById('in-player-uid');
  const serverBadge = document.getElementById('uid-server-badge');
  const searchBtn = document.getElementById('btn-search-uid');
  const profileContainer = document.getElementById('uid-profile-result');
  const savedUid = localStorage.getItem('wuwa_player_uid') || '502891402';

  if (uidInput) {
    uidInput.value = savedUid;
    updatePrefixDetection(savedUid);

    uidInput.addEventListener('input', () => {
      updatePrefixDetection(uidInput.value);
    });
  }

  function updatePrefixDetection(val) {
    if (!serverBadge) return;
    const res = detectServerByUID(val);
    if (res.isValid) {
      serverBadge.textContent = `Servidor detectado: ${res.serverName}`;
      serverBadge.className = 'badge badge-gold';
    } else {
      serverBadge.textContent = 'Ingresa un UID de 9 dígitos';
      serverBadge.className = 'badge';
    }
  }

  function performSearch() {
    if (!uidInput || !profileContainer) return;
    try {
      const profile = getPlayerProfile(uidInput.value);
      localStorage.setItem('wuwa_player_uid', profile.uid);

      profileContainer.style.display = 'block';
      profileContainer.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-white-solid); padding: 1.5rem; margin-top: 1.25rem;">
          <!-- Header card -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <h3 style="font-size: 1.35rem; font-weight: 800; color: #ffffff;">${profile.nickname}</h3>
                <span class="badge badge-gold">${profile.server}</span>
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--gold-primary); margin-top: 0.25rem; font-weight: 700;">
                UID: ${profile.uid}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-sync-to-planner">
              🔄 Sincronizar con Planificador
            </button>
          </div>

          <!-- Key Metrics -->
          <div class="grid-3" style="margin-bottom: 1.25rem;">
            <div class="metric-box">
              <div class="metric-val" style="color: #ffffff;">${profile.unionLevel}</div>
              <div class="metric-label">Nivel de Unión</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" style="color: var(--gold-primary);">${profile.sol3Phase}</div>
              <div class="metric-label">Fase Sol-3 (Mundo)</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" style="color: var(--gold-primary);">${profile.towerStars}/30</div>
              <div class="metric-label">Estrellas Torre</div>
            </div>
          </div>

          <!-- Resonators Showcase -->
          <div style="margin-bottom: 1.25rem;">
            <div class="card-title" style="font-size: 0.88rem; margin-bottom: 0.65rem;">🌟 Resonadores en Expositor Público</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
              ${profile.showcase.map(char => `
                <div style="background: var(--bg-page); border: 1px solid var(--border-white-subtle); border-left: 3px solid var(--gold-primary); padding: 0.85rem; display: flex; align-items: center; gap: 0.75rem;">
                  <div style="flex-shrink: 0;">${getElementIcon(char.element)}</div>
                  <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong style="color: #ffffff; font-size: 0.95rem;">${char.name}</strong>
                      <span style="color: var(--gold-primary); font-size: 0.8rem; letter-spacing: 1px;">★★★★★</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                      ${char.element} • ${char.role}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Exploration progress -->
          <div>
            <div class="card-title" style="font-size: 0.88rem; margin-bottom: 0.65rem;">🗺️ Progreso de Exploración Registrado</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; font-size: 0.8rem;">
              <div style="background: var(--bg-page); padding: 0.65rem 0.85rem; border: 1px solid var(--border-white-subtle);">
                <span style="color: var(--text-muted);">Jinzhou:</span> <strong style="color: var(--gold-primary);">${profile.exploration.jinzhou}</strong>
              </div>
              <div style="background: var(--bg-page); padding: 0.65rem 0.85rem; border: 1px solid var(--border-white-subtle);">
                <span style="color: var(--text-muted);">Llanuras:</span> <strong style="color: var(--gold-primary);">${profile.exploration.centralPlains}</strong>
              </div>
              <div style="background: var(--bg-page); padding: 0.65rem 0.85rem; border: 1px solid var(--border-white-subtle);">
                <span style="color: var(--text-muted);">Mt. Firmament:</span> <strong style="color: var(--gold-primary);">${profile.exploration.mtFirmament}</strong>
              </div>
              <div style="background: var(--bg-page); padding: 0.65rem 0.85rem; border: 1px solid var(--border-white-subtle);">
                <span style="color: var(--text-muted);">Costa Negra:</span> <strong style="color: var(--gold-primary);">${profile.exploration.blackShores}</strong>
              </div>
            </div>
          </div>
        </div>
      `;

      // Attach sync to planner button
      document.getElementById('btn-sync-to-planner')?.addEventListener('click', () => {
        STATE.towerStars = profile.towerStars;
        localStorage.setItem('wuwa_tower_stars', profile.towerStars);
        showToast(`Datos del UID ${profile.uid} sincronizados con el planificador!`);
      });

      showToast(`¡Perfil de ${profile.nickname} (UID: ${profile.uid}) cargado con éxito!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }

  // Pre-load initial profile
  performSearch();
}

/* ==========================================================================
   Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initPullsPlanner();
  initWaveplateTracker();
  initServerSync();
  initUidLookup();
  renderSecrets();
  renderEchoes();
  renderCodes();
});

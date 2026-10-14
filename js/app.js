/**
 * Wuthering Waves Companion & Pulls Planner
 * Main Application Controller
 */

import { RECURRING_SOURCES, HIDDEN_SECRETS } from './data/astrite-sources.js';
import { SONATA_SETS, COST_CONFIGS, DATA_BANK_TIPS } from './data/echoes.js';
import { PROMO_CODES, REDEEM_GUIDE } from './data/codes.js';

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
  const inPity = document.getElementById('in-pity');
  const inPityVal = document.getElementById('in-pity-val');
  const inGuaranteed = document.getElementById('in-guaranteed');
  const inDays = document.getElementById('in-days');
  const inLunite = document.getElementById('in-lunite');
  const inPodcast = document.getElementById('in-podcast');

  // Outputs
  const outCurrentPulls = document.getElementById('out-current-pulls');
  const outFuturePulls = document.getElementById('out-future-pulls');
  const outGuaranteedNeeded = document.getElementById('out-guaranteed-needed');
  const pityBarFill = document.getElementById('pity-bar-fill');
  const pityStatusText = document.getElementById('pity-status-text');

  // Load state to inputs
  inAstrite.value = STATE.astrite;
  inRadiant.value = STATE.radiantTides;
  inForging.value = STATE.forgingTides;
  inPity.value = STATE.pity;
  inPityVal.textContent = STATE.pity;
  inGuaranteed.checked = STATE.isGuaranteed;
  inDays.value = STATE.daysRemaining;
  inLunite.checked = STATE.hasLunite;
  inPodcast.checked = STATE.hasPodcast;

  function calculate() {
    // Current pulls
    const astritePulls = Math.floor(STATE.astrite / 160);
    const totalCurrentPulls = astritePulls + STATE.radiantTides;
    outCurrentPulls.textContent = totalCurrentPulls;

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

    outFuturePulls.textContent = totalEstPulls;

    // Pity calculations
    // Hard pity = 80
    // If not guaranteed: worst case = (80 - currentPity) + 80 = 160 - currentPity
    // If guaranteed: worst case = 80 - currentPity
    const pullsToNext5Star = Math.max(0, 80 - STATE.pity);
    const pullsToGuaranteed = STATE.isGuaranteed ? pullsToNext5Star : pullsToNext5Star + 80;

    outGuaranteedNeeded.textContent = pullsToGuaranteed;

    // Update pity bar (80 max)
    const pct = Math.min(100, Math.round((STATE.pity / 80) * 100));
    pityBarFill.style.width = `${pct}%`;

    let pityTier = 'Tiradas iniciales';
    if (STATE.pity >= 65) {
      pityTier = '¡ZONA DE SOFT PITY! (Probabilidad muy alta de 5★)';
    } else if (STATE.pity >= 40) {
      pityTier = 'Pity intermedio';
    }
    pityStatusText.textContent = `${STATE.pity}/80 • ${STATE.isGuaranteed ? 'Garantizado (100%)' : '50/50'} • ${pityTier}`;

    // Save to storage
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

  inAstrite.addEventListener('input', () => {
    STATE.astrite = Math.max(0, parseInt(inAstrite.value, 10) || 0);
    calculate();
  });
  inRadiant.addEventListener('input', () => {
    STATE.radiantTides = Math.max(0, parseInt(inRadiant.value, 10) || 0);
    calculate();
  });
  inForging.addEventListener('input', () => {
    STATE.forgingTides = Math.max(0, parseInt(inForging.value, 10) || 0);
    calculate();
  });
  inPity.addEventListener('input', () => {
    STATE.pity = parseInt(inPity.value, 10);
    inPityVal.textContent = STATE.pity;
    calculate();
  });
  inGuaranteed.addEventListener('change', () => {
    STATE.isGuaranteed = inGuaranteed.checked;
    calculate();
  });
  inDays.addEventListener('input', () => {
    STATE.daysRemaining = Math.max(0, parseInt(inDays.value, 10) || 0);
    calculate();
  });
  inLunite.addEventListener('change', () => {
    STATE.hasLunite = inLunite.checked;
    calculate();
  });
  inPodcast.addEventListener('change', () => {
    STATE.hasPodcast = inPodcast.checked;
    calculate();
  });

  calculate();
}

/* ==========================================================================
   Waveplate (Stamina) Live Calculator
   ========================================================================== */

function initWaveplateTracker() {
  const waveInput = document.getElementById('in-waveplate');
  const waveFill = document.getElementById('waveplate-bar-fill');
  const waveCapTime = document.getElementById('waveplate-cap-time');
  const waveCountdown = document.getElementById('waveplate-countdown');
  const topPillVal = document.getElementById('top-waveplate-val');

  function getCalculatedWaveplate() {
    const elapsedMinutes = (Date.now() - STATE.waveplateUpdatedAt) / (1000 * 60);
    const recovered = Math.floor(elapsedMinutes / 6); // 1 per 6 min
    return Math.min(240, STATE.currentWaveplate + recovered);
  }

  function update() {
    const current = getCalculatedWaveplate();
    waveInput.value = current;
    topPillVal.textContent = `${current}/240`;

    const pct = Math.min(100, Math.round((current / 240) * 100));
    waveFill.style.width = `${pct}%`;

    const remaining = 240 - current;
    if (remaining <= 0) {
      waveCapTime.textContent = '¡Completamente llena! (240/240)';
      waveCountdown.textContent = '0h 0m';
    } else {
      const minutesNeeded = remaining * 6;
      const hours = Math.floor(minutesNeeded / 60);
      const mins = minutesNeeded % 60;
      waveCountdown.textContent = `${hours}h ${mins}m restantes`;

      const capDate = new Date(Date.now() + minutesNeeded * 60 * 1000);
      waveCapTime.textContent = `Lleno a las ${capDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${capDate.toLocaleDateString()})`;
    }
  }

  waveInput.addEventListener('change', () => {
    STATE.currentWaveplate = Math.max(0, Math.min(240, parseInt(waveInput.value, 10) || 0));
    STATE.waveplateUpdatedAt = Date.now();
    localStorage.setItem('wuwa_waveplate', STATE.currentWaveplate);
    localStorage.setItem('wuwa_waveplate_time', STATE.waveplateUpdatedAt);
    update();
    showToast('Nivel de Waveplate actualizado!');
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
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <strong style="color: var(--text-main); font-size: 0.95rem;">${s.name}</strong>
        <span class="badge ${s.category === 'f2p' ? 'badge-cyan' : 'badge-gold'}">+${s.amount} Astrite</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">${s.desc}</p>
      <div style="font-size: 0.75rem; color: var(--wuwa-cyan); font-family: var(--font-mono);">
        Frecuencia: ${s.frequency} • ~${s.monthlyEst} Astrite / mes
      </div>
    </div>
  `).join('');

  secretsContainer.innerHTML = HIDDEN_SECRETS.map(h => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 0.85rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <strong style="color: var(--wuwa-gold); font-size: 1rem;">${h.title}</strong>
        <span class="badge badge-gold">${h.reward}</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 0.5rem;">${h.desc}</p>
      <div style="background: rgba(0, 242, 254, 0.06); border-left: 3px solid var(--wuwa-cyan); padding: 0.5rem 0.75rem; font-size: 0.8rem; color: var(--wuwa-cyan); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
        💡 <strong>Truco:</strong> ${h.tips}
      </div>
    </div>
  `).join('');
}

function renderEchoes() {
  const sonataContainer = document.getElementById('sonata-list');
  const configsContainer = document.getElementById('configs-list');
  const bankContainer = document.getElementById('databank-list');

  sonataContainer.innerHTML = SONATA_SETS.map(s => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-top: 3px solid ${s.color}; border-radius: var(--radius-md); padding: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <strong style="color: ${s.color}; font-size: 0.95rem;">${s.name}</strong>
        <span class="badge" style="background: rgba(255,255,255,0.08);">${s.element}</span>
      </div>
      <div style="font-size: 0.8rem; margin-bottom: 0.35rem;"><strong>2 Piezas:</strong> <span style="color: var(--text-muted);">${s.twoPiece}</span></div>
      <div style="font-size: 0.8rem; margin-bottom: 0.75rem;"><strong>5 Piezas:</strong> <span style="color: var(--text-muted);">${s.fivePiece}</span></div>
      <div style="font-size: 0.75rem; color: var(--wuwa-cyan);">
        <strong>Recomendado para:</strong> ${s.recommendedFor.join(', ')}
      </div>
    </div>
  `).join('');

  configsContainer.innerHTML = COST_CONFIGS.map(c => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 0.85rem;">
      <h3 style="color: var(--wuwa-gold); font-size: 1rem; margin-bottom: 0.4rem;">${c.type}</h3>
      <div style="font-size: 0.85rem; color: var(--wuwa-cyan); margin-bottom: 0.5rem; font-family: var(--font-mono);">${c.statPriority}</div>
      <div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 0.25rem;">✅ <strong>Ventaja:</strong> ${c.pros}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">⚠️ <strong>Atención:</strong> ${c.cons}</div>
    </div>
  `).join('');

  bankContainer.innerHTML = DATA_BANK_TIPS.map(d => `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 0.5rem;">
      <strong style="color: var(--wuwa-cyan); font-size: 0.9rem;">${d.level} — ${d.feature}</strong>
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
      <strong style="color: var(--wuwa-cyan);">${idx + 1}.</strong> ${step}
    </li>
  `).join('');
}

/* ==========================================================================
   Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initPullsPlanner();
  initWaveplateTracker();
  renderSecrets();
  renderEchoes();
  renderCodes();
});

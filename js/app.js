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
   UI Helpers: Toast, Terminal Log & Clipboard
   ========================================================================== */

export function terminalLog(tag, message) {
  const stream = document.getElementById('terminal-log-stream');
  if (!stream) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const line = document.createElement('div');
  line.className = 'console-line';
  line.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-tag">[${tag}]</span> <span class="log-msg">${message}</span>`;
  stream.appendChild(line);
  stream.scrollTop = stream.scrollHeight;
}

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
    terminalLog('CLIPBOARD', `Código promocional ${text} copiado al búfer.`);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(`Código ${text} copiado!`);
    terminalLog('CLIPBOARD', `Código ${text} copiado.`);
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
      <strong style="color: var(--wuwa-cyan);">${idx + 1}.</strong> ${step}
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
              <span style="font-family: var(--font-mono); color: var(--wuwa-cyan); font-weight: 600;">🔄 ${towerReset}</span>
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
      serverBadge.className = 'badge badge-cyan';
    } else {
      serverBadge.textContent = 'Ingresa un UID de 9 dígitos';
      serverBadge.className = 'badge badge-gold';
    }
  }

  function performSearch() {
    if (!uidInput || !profileContainer) return;
    try {
      const profile = getPlayerProfile(uidInput.value);
      localStorage.setItem('wuwa_player_uid', profile.uid);

      profileContainer.style.display = 'block';
      profileContainer.innerHTML = `
        <div style="background: var(--bg-surface); border: 1px solid var(--wuwa-cyan); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1rem; box-shadow: 0 0 20px rgba(0, 242, 254, 0.15);">
          <!-- Header card -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${profile.nickname}</h3>
                <span class="badge badge-gold">${profile.server}</span>
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--wuwa-cyan); margin-top: 0.25rem;">
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
              <div class="metric-val" style="color: var(--wuwa-cyan);">${profile.unionLevel}</div>
              <div class="metric-label">Nivel de Unión</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" style="color: var(--wuwa-gold);">${profile.sol3Phase}</div>
              <div class="metric-label">Fase Sol-3 (Mundo)</div>
            </div>
            <div class="metric-box">
              <div class="metric-val" style="color: var(--wuwa-purple);">${profile.towerStars}/30</div>
              <div class="metric-label">Estrellas Torre</div>
            </div>
          </div>

          <!-- Resonators Showcase -->
          <div style="margin-bottom: 1.25rem;">
            <div class="card-title" style="font-size: 0.95rem; margin-bottom: 0.65rem;">🌟 Resonadores en Expositor Público</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
              ${profile.showcase.map(char => `
                <div style="background: var(--bg-card); border: 1px solid var(--border-tech); border-left: 3px solid ${char.color}; border-radius: var(--radius-sm); padding: 0.85rem; display: flex; align-items: center; gap: 0.75rem;">
                  <div style="flex-shrink: 0;">${getElementIcon(char.element)}</div>
                  <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong style="color: ${char.color}; font-size: 0.95rem;">${char.name}</strong>
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
            <div class="card-title" style="font-size: 0.95rem; margin-bottom: 0.65rem;">🗺️ Progreso de Exploración Registrado</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; font-size: 0.8rem;">
              <div style="background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted);">Jinzhou:</span> <strong style="color: var(--wuwa-cyan);">${profile.exploration.jinzhou}</strong>
              </div>
              <div style="background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted);">Llanuras:</span> <strong style="color: var(--wuwa-cyan);">${profile.exploration.centralPlains}</strong>
              </div>
              <div style="background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted);">Mt. Firmament:</span> <strong style="color: var(--wuwa-cyan);">${profile.exploration.mtFirmament}</strong>
              </div>
              <div style="background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <span style="color: var(--text-muted);">Costa Negra:</span> <strong style="color: var(--wuwa-cyan);">${profile.exploration.blackShores}</strong>
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
        terminalLog('DATA_SYNC', `UID ${profile.uid}: ${profile.towerStars} estrellas de Torre transferidas al planificador.`);
      });

      showToast(`¡Perfil de ${profile.nickname} (UID: ${profile.uid}) cargado con éxito!`);
      terminalLog('UID_INSPECT', `Perfil cargado: ${profile.nickname} (UID: ${profile.uid}) • Nivel Unión: ${profile.unionLevel} • Fase Sol-3: ${profile.sol3Phase}`);
    } catch (err) {
      showToast(err.message, 'error');
      terminalLog('ERROR', `Fallo al consultar UID: ${err.message}`);
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }

  // Pre-load initial profile
  performSearch();
}

/* ==========================================================================
   Terminal Interactive CLI Runner
   ========================================================================== */

function initTerminalCLI() {
  const cliInput = document.getElementById('cli-command-input');
  const runBtn = document.getElementById('btn-run-cli');

  function executeCommand() {
    if (!cliInput) return;
    const raw = cliInput.value.trim().toLowerCase();
    if (!raw) return;

    cliInput.value = '';
    terminalLog('EXEC', `> ${raw}`);

    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1];

    switch (cmd) {
      case 'planner':
      case 'gacha':
      case 'pity':
      case 'tiradas':
        document.querySelector('[data-tab="planner"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: PLANIFICADOR_DE_TIRADAS');
        break;

      case 'waveplate':
      case 'stamina':
      case 'resina':
      case 'energia':
        document.querySelector('[data-tab="waveplate"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: MONITOR_DE_WAVEPLATE');
        break;

      case 'secrets':
      case 'astrite':
      case 'secretos':
        document.querySelector('[data-tab="secrets"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: FUENTES_DE_ASTRITE');
        break;

      case 'echo':
      case 'echoes':
      case 'ecos':
      case 'sets':
        document.querySelector('[data-tab="echoes"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: GUIA_DE_ECOS_Y_SONATA');
        break;

      case 'codes':
      case 'codigos':
      case 'promo':
        document.querySelector('[data-tab="codes"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: CODIGOS_PROMOCIONALES');
        break;

      case 'servers':
      case 'servidores':
      case 'sync':
      case 'kuro':
        document.querySelector('[data-tab="servers"]')?.click();
        terminalLog('SYS', 'Cambiado a contexto: SERVIDORES_Y_CONEXION_KURO');
        break;

      case 'uid':
        document.querySelector('[data-tab="servers"]')?.click();
        if (arg) {
          const uidInput = document.getElementById('in-player-uid');
          if (uidInput) {
            uidInput.value = arg;
            document.getElementById('btn-search-uid')?.click();
          }
        }
        break;

      case 'clear':
      case 'cls':
        const stream = document.getElementById('terminal-log-stream');
        if (stream) stream.innerHTML = '';
        terminalLog('SYS', 'Consola del terminal reiniciada.');
        break;

      case 'help':
      case '?':
        terminalLog('HELP', 'Comandos disponibles: planner, waveplate, uid [id], echoes, secrets, codes, servers, clear');
        break;

      default:
        terminalLog('WARN', `Comando no reconocido: "${cmd}". Escribe "help" para ver la lista de comandos.`);
    }
  }

  if (cliInput) {
    cliInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeCommand();
      }
    });
  }

  if (runBtn) {
    runBtn.addEventListener('click', executeCommand);
  }
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
  initTerminalCLI();
  renderSecrets();
  renderEchoes();
  renderCodes();
});

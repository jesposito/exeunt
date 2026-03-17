'use strict';

const DEFAULTS = {
  score:            100,
  sessionMinutes:   5,
  scorm12Status:    'auto',
  autoScan:         true,
  autoComplete:     false,
  retryCount:       6,
  retryDelayMs:     1800,
  clearSuspendData: false,
  verifyAfter:      true,
  showTagline:      true,
};

const $ = id => document.getElementById(id);

// ── HTML ESCAPE ───────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── TAB NAVIGATION ──────────────────────────────────────────────────────────
const navItems = Array.from(document.querySelectorAll('.nav-item[role="tab"]'));

function activateTab(item) {
  navItems.forEach(n => {
    n.classList.remove('nav-item--active');
    n.setAttribute('aria-selected', 'false');
    n.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('tab-pane--active'));

  item.classList.add('nav-item--active');
  item.setAttribute('aria-selected', 'true');
  item.setAttribute('tabindex', '0');

  const tab = item.dataset.tab;
  const pane = document.getElementById('tab' + tab[0].toUpperCase() + tab.slice(1));
  if (pane) pane.classList.add('tab-pane--active');
  if (tab === 'history') renderHistory();
}

navItems.forEach(item => {
  item.addEventListener('click', () => activateTab(item));

  item.addEventListener('keydown', e => {
    const idx = navItems.indexOf(item);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = navItems[(idx + 1) % navItems.length];
      next.focus();
      activateTab(next);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = navItems[(idx - 1 + navItems.length) % navItems.length];
      prev.focus();
      activateTab(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateTab(item);
    }
  });
});

// ── SCORE SLIDER <-> NUMBER SYNC ────────────────────────────────────────────
const scoreSlider = $('scoreSlider');
const scoreNum    = $('scoreNum');
scoreSlider?.addEventListener('input', () => { scoreNum.value = scoreSlider.value; });
scoreNum?.addEventListener('input',   () => {
  let v = parseInt(scoreNum.value, 10);
  if (isNaN(v)) return;
  v = Math.min(100, Math.max(0, v));
  scoreSlider.value = v;
  scoreNum.value    = v;
});

// ── LOAD SETTINGS ───────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await chrome.storage.sync.get(DEFAULTS);

    if (scoreSlider) scoreSlider.value = s.score;
    if (scoreNum)    scoreNum.value    = s.score;
    setVal('sessionTime',    s.sessionMinutes);
    setVal('retryCount',     s.retryCount);
    setVal('retryDelayMs',   s.retryDelayMs);
    setCheck('autoScan',         s.autoScan);
    setCheck('autoComplete',     s.autoComplete);
    setCheck('clearSuspendData', s.clearSuspendData);
    setCheck('verifyAfter',      s.verifyAfter);
    setCheck('showTagline',      s.showTagline);

    // Radio
    const radios = document.querySelectorAll('input[name="scorm12Status"]');
    radios.forEach(r => { r.checked = r.value === s.scorm12Status; });
  } catch (err) {
    console.error('[Exeunt] loadSettings failed:', err);
  }
}

function setVal(id, v)   { const el = $(id); if (el) el.value = v; }
function setCheck(id, v) { const el = $(id); if (el) el.checked = !!v; }

// ── SAVE SETTINGS ───────────────────────────────────────────────────────────
async function saveSettings() {
  try {
    const score = parseInt(scoreNum?.value ?? '100', 10);
    const radioEl = document.querySelector('input[name="scorm12Status"]:checked');

    const settings = {
      score:            isNaN(score) ? 100 : Math.min(100, Math.max(0, score)),
      sessionMinutes:   parseFloat($('sessionTime')?.value   ?? '5')   || 5,
      scorm12Status:    radioEl?.value ?? 'auto',
      autoScan:         !!$('autoScan')?.checked,
      autoComplete:     !!$('autoComplete')?.checked,
      retryCount:       parseInt($('retryCount')?.value    ?? '6', 10) || 6,
      retryDelayMs:     parseInt($('retryDelayMs')?.value  ?? '1800', 10) || 1800,
      clearSuspendData: !!$('clearSuspendData')?.checked,
      verifyAfter:      !!$('verifyAfter')?.checked,
      showTagline:      !!$('showTagline')?.checked,
    };

    await chrome.storage.sync.set(settings);
    flashSave();
  } catch (err) {
    console.error('[Exeunt] saveSettings failed:', err);
  }
}

function flashSave() {
  const btn = $('saveBtn');
  const status = $('saveStatus');
  if (btn) { btn.textContent = 'Saved \u2713'; btn.classList.add('save-btn--done'); }
  if (status) { status.textContent = 'Settings saved'; status.classList.add('save-status--visible'); }
  setTimeout(() => {
    if (btn)    { btn.textContent = 'Save Settings'; btn.classList.remove('save-btn--done'); }
    if (status) { status.classList.remove('save-status--visible'); }
  }, 2500);
}

// ── HISTORY ─────────────────────────────────────────────────────────────────
async function renderHistory() {
  const container = $('historyList');
  if (!container) return;

  try {
    const data = await chrome.storage.local.get({ history: [] });
    const history = data.history || [];

    if (!history.length) {
      container.innerHTML = '<div class="history-empty">No completions recorded yet.</div>';
      return;
    }

    container.innerHTML = history.map(item => {
      const date = new Date(item.ts);
      const dateStr = date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
      const domain = (() => { try { return new URL(item.url).hostname; } catch (_) { return item.url.slice(0, 40); } })();
      return `
        <div class="history-item">
          <div class="history-meta">
            <span class="history-type ${item.type === 'scorm12' ? 'history-type--12' : 'history-type--2004'}">${item.type === 'scorm12' ? 'SCORM 1.2' : 'SCORM 2004'}</span>
            <span class="history-lms">${esc(item.lms ?? 'Unknown LMS')}</span>
          </div>
          <div class="history-url">${esc(domain)}</div>
          <div class="history-title">${esc(item.title || '(untitled)')}</div>
          <div class="history-time">${dateStr} \u00b7 ${timeStr} \u00b7 Score: ${item.score}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('[Exeunt] renderHistory failed:', err);
    container.innerHTML = '<div class="history-empty">Could not load history.</div>';
  }
}

// ── CLEAR HISTORY ───────────────────────────────────────────────────────────
$('clearHistoryBtn')?.addEventListener('click', async () => {
  if (!confirm('Clear all completion history?')) return;
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

// ── WIRE UP ──────────────────────────────────────────────────────────────────
$('saveBtn')?.addEventListener('click', saveSettings);

// Boot
loadSettings();

// Version from manifest - always in sync with release
const verEl = $('brandVer');
if (verEl) verEl.textContent = 'v' + chrome.runtime.getManifest().version;

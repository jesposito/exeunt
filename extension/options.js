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

// ── TAB NAVIGATION ──────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('nav-item--active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('tab-pane--active'));
    item.classList.add('nav-item--active');
    const pane = document.getElementById('tab' + tab[0].toUpperCase() + tab.slice(1));
    if (pane) pane.classList.add('tab-pane--active');
    if (tab === 'history') renderHistory();
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
}

function setVal(id, v)   { const el = $(id); if (el) el.value = v; }
function setCheck(id, v) { const el = $(id); if (el) el.checked = !!v; }

// ── SAVE SETTINGS ───────────────────────────────────────────────────────────
async function saveSettings() {
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
}

function flashSave() {
  const btn = $('saveBtn');
  const status = $('saveStatus');
  if (btn) { btn.textContent = 'Saved ✓'; btn.classList.add('save-btn--done'); }
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
          <span class="history-lms">${item.lms ?? 'Unknown LMS'}</span>
        </div>
        <div class="history-url">${domain}</div>
        <div class="history-title">${item.title || '(untitled)'}</div>
        <div class="history-time">${dateStr} · ${timeStr} · Score: ${item.score}</div>
      </div>
    `;
  }).join('');
}

// ── CLEAR HISTORY ───────────────────────────────────────────────────────────
$('clearHistoryBtn')?.addEventListener('click', async () => {
  if (!confirm('Clear all completion history?')) return;
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

// ── WIRE UP ──────────────────────────────────────────────────────────────────
$('saveBtn')?.addEventListener('click', saveSettings);

// Auto-save on any change
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('change', saveSettings);
});

// Boot
loadSettings();

// Version from manifest — always in sync with release
const verEl = $('brandVer');
if (verEl) verEl.textContent = 'v' + chrome.runtime.getManifest().version;

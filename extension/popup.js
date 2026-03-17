'use strict';

// ════════════════════════════════════════════════════════════════════════════
//  DEFAULTS  (mirrored in options.js)
// ════════════════════════════════════════════════════════════════════════════
const DEFAULTS = {
  score:            100,
  sessionMinutes:   5,
  scorm12Status:    'auto',   // 'auto' | 'passed' | 'completed'
  autoScan:         true,
  autoComplete:     false,
  retryCount:       6,
  retryDelayMs:     1800,
  clearSuspendData: false,
  verifyAfter:      true,
  showTagline:      true,
};

// ════════════════════════════════════════════════════════════════════════════
//  SCORM ERROR CODE TABLES  (for human-readable messages in log)
// ════════════════════════════════════════════════════════════════════════════
const SCORM12_ERRORS = {
  '0':   'No error',
  '101': 'Already initialized — continuing with existing session',
  '201': 'No LMS present',
  '202': 'LMSInitialize not called',
  '203': 'LMSFinish already called',
  '301': 'Not initialized',
  '401': 'Element not implemented',
  '402': 'Element cannot be set',
  '403': 'Element read only',
  '404': 'Element write only',
  '405': 'Incorrect data type',
};
const SCORM2004_ERRORS = {
  '0':   'No error',
  '102': 'General initialization failure',
  '103': 'Already initialized',
  '104': 'Content instance terminated',
  '111': 'General termination failure',
  '112': 'Termination before initialization',
  '113': 'Termination after termination',
  '122': 'Retrieve data before initialization',
  '123': 'Retrieve data after termination',
  '132': 'Store data before initialization',
  '133': 'Store data after termination',
  '142': 'Commit before initialization',
  '143': 'Commit after termination',
  '391': 'Completion status — element set before init',
  '401': 'Undefined data model element',
  '402': 'Unimplemented data model element',
  '403': 'Data model element value not initialized',
  '404': 'Data model element is read only',
  '405': 'Data model element is write only',
  '406': 'Data model element type mismatch',
};

// ════════════════════════════════════════════════════════════════════════════
//  PAGE-INJECTED FUNCTIONS  (must be completely self-contained)
// ════════════════════════════════════════════════════════════════════════════

function _detect() {
  function lmsSniff() {
    const hay = [
      location.href, document.title,
      document.body?.innerHTML?.slice(0, 5000) ?? '',
    ].join(' ').toLowerCase();
    const lmsList = [
      ['Moodle',               ['moodle', '/mod/scorm/']],
      ['Totara Learn',         ['totara']],
      ['Cornerstone OnDemand', ['csod.com', 'cornerstone']],
      ['SAP SuccessFactors',   ['successfactors', 'sfsf.com']],
      ['Docebo',               ['docebo']],
      ['TalentLMS',            ['talentlms']],
      ['LearnUpon',            ['learnupon']],
      ['Absorb LMS',           ['absorblms', 'myabsorb']],
      ['Blackboard Learn',     ['blackboard', 'bblearn']],
      ['Canvas (Instructure)', ['instructure.com', '/courses/']],
      ['SABA',                 ['saba.com']],
      ['SumTotal',             ['sumtotal']],
      ['Kallidus',             ['kallidus']],
      ['iSpring',              ['ispring']],
      ['Articulate Rise',      ['rise.articulate.com']],
      ['SCORM Cloud',          ['scormcloud.com', 'scorm.com']],
      ['Litmos',               ['litmos']],
      ['360Learning',          ['360learning']],
      ['Workday Learning',     ['workday.com/learn']],
    ];
    for (const [name, pats] of lmsList) {
      if (pats.some(p => hay.includes(p))) return name;
    }
    return null;
  }

  function xapiSniff() {
    for (const k of ['ADL', 'TinCan', 'tincan', 'xAPI', 'cmi5']) {
      try { if (window[k] != null) return k; } catch (_) {}
    }
    const scripts = [...(document.querySelectorAll('script[src]') || [])];
    if (scripts.some(s => /tincan|xapi|cmi5/i.test(s.getAttribute('src') || ''))) return 'script-src';
    const p = new URLSearchParams(location.search);
    if (p.has('endpoint') || p.has('actor') || p.has('registration')) return 'launch-params';
    return null;
  }

  // Also check common shim locations beyond window.API / window.API_1484_11
  let s12Loc   = null;
  let s2004Loc = null;

  const checks12 = [
    ['window.API', () => window.API],
    ['window.top.API', () => { try { return window.top.API; } catch(_){} }],
    ['window.parent.API', () => { try { return window.parent.API; } catch(_){} }],
    ['pipwerks shim', () => { try { return window.pipwerks?.SCORM?.API?.handle; } catch(_){} }],
  ];
  const checks2004 = [
    ['window.API_1484_11', () => window.API_1484_11],
    ['window.top.API_1484_11', () => { try { return window.top.API_1484_11; } catch(_){} }],
    ['window.parent.API_1484_11', () => { try { return window.parent.API_1484_11; } catch(_){} }],
  ];

  for (const [loc, getter] of checks12) {
    try {
      const a = getter();
      if (a && typeof a.LMSInitialize === 'function') { s12Loc = loc; break; }
    } catch (_) {}
  }
  for (const [loc, getter] of checks2004) {
    try {
      const a = getter();
      if (a && typeof a.Initialize === 'function') { s2004Loc = loc; break; }
    } catch (_) {}
  }

  // Gather current CMI snapshot for context
  let currentStatus = null, currentScore = null, currentComp = null;
  if (s12Loc) {
    try { currentStatus = window.API?.LMSGetValue?.('cmi.core.lesson_status'); } catch(_) {}
    try { currentScore  = window.API?.LMSGetValue?.('cmi.core.score.raw'); }      catch(_) {}
  }
  if (s2004Loc) {
    try { currentComp  = window.API_1484_11?.GetValue?.('cmi.completion_status'); } catch(_) {}
    try { currentScore = window.API_1484_11?.GetValue?.('cmi.score.scaled'); }      catch(_) {}
  }

  return {
    url:           location.href.slice(0, 160),
    s12:           !!s12Loc,
    s12Loc,
    s2004:         !!s2004Loc,
    s2004Loc,
    xapi:          xapiSniff(),
    aicc:          !!(new URLSearchParams(location.search).get('AICC_URL') || new URLSearchParams(location.search).get('aicc_url')),
    lms:           lmsSniff(),
    currentStatus,
    currentScore,
    currentComp,
  };
}

function _completeSCORM12(opts) {
  // opts: { score, sessionMinutes, preferredStatus, clearSuspend, verify }
  const log = [];
  const L = {
    h:  m      => log.push({ t: 'h',  m }),
    ok: m      => log.push({ t: 'ok', m }),
    w:  m      => log.push({ t: 'w',  m }),
    e:  m      => log.push({ t: 'e',  m }),
    kv: (k, v) => log.push({ t: 'kv', k, v: String(v) }),
    n:  m      => log.push({ t: 'n',  m }),
  };

  const ERRORS = {
    '0':'No error','101':'Already initialized','201':'No LMS present',
    '202':'LMSInitialize not called','203':'LMSFinish already called',
    '401':'Element not implemented','402':'Cannot be set','403':'Read only',
    '404':'Write only','405':'Incorrect data type',
  };

  const api = window.API;
  if (!api) {
    L.e('window.API not found — page may have navigated. Re-scan and try again.');
    return log;
  }
  if (typeof api.LMSInitialize !== 'function') {
    L.e('window.API exists but LMSInitialize is not a function — not a valid SCORM 1.2 API');
    return log;
  }

  L.h('SCORM 1.2  ·  Completion Sequence');

  // Initialize
  const initR = String(api.LMSInitialize(''));
  const initErr = api.LMSGetLastError?.() ?? '?';
  L.kv('LMSInitialize()', initR + (initR === 'false' ? '  [err ' + initErr + ': ' + (ERRORS[String(initErr)] || 'unknown') + ']' : ''));

  if (initR === 'false') {
    const code = String(initErr);
    if (code === '101' || code === '301') {
      L.w('Session already active — continuing without re-initializing');
    } else if (code === '203') {
      L.e('LMSFinish was already called — course session is closed. Reload the course and retry.');
      return log;
    } else {
      L.w('LMSInitialize returned false (error ' + code + ') — attempting to proceed regardless');
    }
  }

  // Snapshot before
  const statusBefore = api.LMSGetValue('cmi.core.lesson_status') || '(empty)';
  const scoreBefore  = api.LMSGetValue('cmi.core.score.raw')     || '(empty)';
  const locBefore    = api.LMSGetValue('cmi.core.lesson_location') || '(empty)';
  L.kv('lesson_status     [before]', statusBefore);
  L.kv('score.raw         [before]', scoreBefore);
  L.kv('lesson_location   [before]', locBefore);

  if (statusBefore === 'passed' || statusBefore === 'completed') {
    L.w('Already ' + statusBefore + ' — overwriting to ensure clean state');
  }

  // Optionally clear suspend data
  if (opts.clearSuspend) {
    const clearR = api.LMSSetValue('cmi.suspend_data', '');
    L.kv('LMSSetValue  cmi.suspend_data', '"" (cleared)  →  ' + clearR);
  }

  // Determine which status string to use
  let statusVal = opts.preferredStatus === 'completed' ? 'completed' : 'passed';

  // Set values in the right order (min/max before raw — some strict LMSes require this)
  const scoreInt = Math.min(100, Math.max(0, Math.round(opts.score)));
  const timeStr  = formatHHMMSS(opts.sessionMinutes);

  const sets = [
    ['cmi.core.score.min',    '0'],
    ['cmi.core.score.max',    '100'],
    ['cmi.core.score.raw',    String(scoreInt)],
    ['cmi.core.lesson_status', statusVal],
    ['cmi.core.session_time', timeStr],
    ['cmi.core.exit',         ''],
  ];

  let statusSet = false;
  for (const [field, value] of sets) {
    const r = String(api.LMSSetValue(field, value));
    const errCode = r === 'false' ? (api.LMSGetLastError?.() ?? '?') : null;
    const errMsg  = errCode ? (ERRORS[String(errCode)] || 'unknown error') : null;
    L.kv('LMSSetValue  ' + field, '"' + value + '"  →  ' + r + (errMsg ? '  [' + errCode + ': ' + errMsg + ']' : ''));

    if (field === 'cmi.core.lesson_status') {
      if (r === 'false' && statusVal === 'passed') {
        L.w('"passed" rejected — retrying with "completed"');
        const r2 = String(api.LMSSetValue(field, 'completed'));
        const e2 = r2 === 'false' ? api.LMSGetLastError?.() : null;
        L.kv('  retry lesson_status', '"completed"  →  ' + r2 + (e2 ? '  [err ' + e2 + ']' : ''));
        if (r2 !== 'false') statusSet = true;
        else L.e('LMS rejected both "passed" and "completed". Check LMS completion rules in settings.');
      } else if (r !== 'false') {
        statusSet = true;
      }
    }
  }

  if (!statusSet) {
    L.e('lesson_status was NOT successfully set — completion may not register');
  }

  // Commit with retry
  let commitR = String(api.LMSCommit(''));
  L.kv('LMSCommit()', commitR);
  if (commitR === 'false') {
    L.w('Commit failed — retrying once');
    commitR = String(api.LMSCommit(''));
    L.kv('LMSCommit() [retry]', commitR);
    if (commitR === 'false') L.e('Commit failed twice — data may not have persisted to LMS');
  }

  // Verify before closing session
  if (opts.verify) {
    const statusAfter = api.LMSGetValue('cmi.core.lesson_status') || '(empty)';
    const scoreAfter  = api.LMSGetValue('cmi.core.score.raw')     || '(empty)';
    L.kv('lesson_status     [verified]', statusAfter);
    L.kv('score.raw         [verified]', scoreAfter);
    if (statusAfter !== 'passed' && statusAfter !== 'completed') {
      L.e('Verification failed — lesson_status is "' + statusAfter + '" not passed/completed');
    }
  }

  const finishR = String(api.LMSFinish(''));
  L.kv('LMSFinish()', finishR);

  if (statusSet && commitR !== 'false') {
    L.ok('Sequence complete — LMS should now record this course as done');
    L.n('The LMS may close or redirect this window shortly');
  } else {
    L.e('Sequence completed with errors — review the log and check your LMS record');
  }
  return log;
}

function _completeSCORM2004(opts) {
  const log = [];
  const L = {
    h:  m      => log.push({ t: 'h',  m }),
    ok: m      => log.push({ t: 'ok', m }),
    w:  m      => log.push({ t: 'w',  m }),
    e:  m      => log.push({ t: 'e',  m }),
    kv: (k, v) => log.push({ t: 'kv', k, v: String(v) }),
    n:  m      => log.push({ t: 'n',  m }),
  };

  const ERRORS = {
    '0':'No error','102':'General init failure','103':'Already initialized',
    '104':'Instance terminated','111':'Termination failure','112':'Terminate before init',
    '391':'Completion status error','401':'Undefined element','402':'Unimplemented',
    '403':'Not initialized','404':'Read only','405':'Write only','406':'Type mismatch',
  };

  const api = window.API_1484_11;
  if (!api) {
    L.e('window.API_1484_11 not found — page may have navigated. Re-scan and try again.');
    return log;
  }
  if (typeof api.Initialize !== 'function') {
    L.e('window.API_1484_11 exists but Initialize is not a function — not a valid SCORM 2004 API');
    return log;
  }

  L.h('SCORM 2004  ·  Completion Sequence');

  const initR   = String(api.Initialize(''));
  const initErr = api.GetLastError?.() ?? '?';
  L.kv('Initialize()', initR + (initR === 'false' ? '  [err ' + initErr + ': ' + (ERRORS[String(initErr)] || 'unknown') + ']' : ''));

  if (initR === 'false') {
    const code = String(initErr);
    if (code === '103') {
      L.w('Session already active (error 103) — continuing without re-initializing');
    } else if (code === '104') {
      L.e('Content instance already terminated (error 104). Reload the course and retry.');
      return log;
    } else {
      L.w('Initialize returned false (error ' + code + ') — attempting to proceed regardless');
    }
  }

  // Snapshot before
  L.kv('completion_status  [before]', api.GetValue('cmi.completion_status') || '(empty)');
  L.kv('success_status     [before]', api.GetValue('cmi.success_status')    || '(empty)');
  L.kv('score.scaled       [before]', api.GetValue('cmi.score.scaled')      || '(empty)');
  L.kv('progress_measure   [before]', api.GetValue('cmi.progress_measure')  || '(empty)');

  if (opts.clearSuspend) {
    const cr = api.SetValue('cmi.suspend_data', '');
    L.kv('SetValue  cmi.suspend_data', '"" (cleared)  →  ' + cr);
  }

  const scoreInt    = Math.min(100, Math.max(0, Math.round(opts.score)));
  const scoreScaled = (scoreInt / 100).toFixed(4);
  const timeStr     = formatPT(opts.sessionMinutes);

  const sets = [
    ['cmi.score.min',         '0'],
    ['cmi.score.max',         '100'],
    ['cmi.score.raw',         String(scoreInt)],
    ['cmi.score.scaled',      scoreScaled],
    ['cmi.progress_measure',  '1'],
    ['cmi.completion_status', 'completed'],
    ['cmi.success_status',    'passed'],
    ['cmi.session_time',      timeStr],
  ];

  let completionSet = false;
  let successSet    = false;

  for (const [field, value] of sets) {
    const r = String(api.SetValue(field, value));
    const errCode = r === 'false' ? (api.GetLastError?.() ?? '?') : null;
    const errMsg  = errCode ? (ERRORS[String(errCode)] || 'unknown') : null;
    L.kv('SetValue  ' + field, '"' + value + '"  →  ' + r + (errMsg ? '  [' + errCode + ': ' + errMsg + ']' : ''));

    if (field === 'cmi.completion_status' && r !== 'false') completionSet = true;
    if (field === 'cmi.success_status') {
      if (r === 'false') {
        // Some implementations don't allow setting success_status independently
        L.w('success_status rejected (some 2004 impls ignore this) — completion_status should still register');
      } else {
        successSet = true;
      }
    }
  }

  if (!completionSet) {
    L.e('completion_status was NOT successfully set — check LMS SCORM 2004 compliance');
  }

  // Verify before closing
  if (opts.verify) {
    const compAfter  = api.GetValue('cmi.completion_status') || '(empty)';
    const succAfter  = api.GetValue('cmi.success_status')    || '(empty)';
    const scoreAfter = api.GetValue('cmi.score.scaled')      || '(empty)';
    L.kv('completion_status  [verified]', compAfter);
    L.kv('success_status     [verified]', succAfter);
    L.kv('score.scaled       [verified]', scoreAfter);
    if (compAfter !== 'completed') {
      L.e('Verification failed — completion_status is "' + compAfter + '"');
    }
  }

  let commitR = String(api.Commit(''));
  L.kv('Commit()', commitR);
  if (commitR === 'false') {
    L.w('Commit failed — retrying once');
    commitR = String(api.Commit(''));
    L.kv('Commit() [retry]', commitR);
    if (commitR === 'false') L.e('Commit failed twice — data may not have persisted');
  }

  const termR = String(api.Terminate(''));
  L.kv('Terminate()', termR);

  if (completionSet && commitR !== 'false') {
    L.ok('Sequence complete — LMS should now record this course as done');
    L.n('The LMS may close or redirect this window shortly');
  } else {
    L.e('Sequence completed with errors — review the log and check your LMS record');
  }
  return log;
}

// Helpers injected into page (must be inlined into the function that needs them
// — actually these are called from popup context and we format strings before passing)
function formatHHMMSS(minutes) {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${String(m).padStart(4, '0')}:${String(s).padStart(2, '0')}:00.00`;
}

function formatPT(minutes) {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `PT${m}M${s}S` : `PT${m}M0S`;
}

// ════════════════════════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════════════════════════
const state = {
  tab:         null,
  settings:    { ...DEFAULTS },
  detected:    null,   // { type, frameId, lms, version, currentStatus, currentScore }
  phase:       'idle',
  scanAttempt: 0,
  retryTimer:  null,
};

// ════════════════════════════════════════════════════════════════════════════
//  DOM HELPERS
// ════════════════════════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

function setPhase(p) {
  state.phase = p;
  document.body.dataset.phase = p;
  // Update the complete button label
  const btn = $('completeBtn');
  if (!btn) return;
  const labels = {
    idle:        '▶  Complete Course',
    scanning:    '▶  Complete Course',
    retrying:    '▶  Complete Course',
    ready:       '▶  Complete Course',
    completing:  '·  Working…',
    done:        '✓  Marked Complete',
    error:       '↺  Retry Completion',
    'not-found': '▶  Complete Course',
    unsupported: '▶  Complete Course',
  };
  btn.textContent = labels[p] ?? '▶  Complete Course';
  btn.disabled = !['ready', 'error'].includes(p);
}

function showCard(id) {
  for (const cid of ['cardScanning', 'cardRetrying', 'cardResult', 'cardNotFound', 'cardUnsupported']) {
    const el = $(cid);
    if (!el) continue;
    el.classList.toggle('card--visible', cid === id);
    el.classList.toggle('card--hidden',  cid !== id);
  }
}

function updateResultCard(d) {
  const ver = d.version ? ` (${d.version})` : '';
  $('standardLabel').textContent = d.type === 'scorm12' ? 'SCORM 1.2' : `SCORM 2004${ver}`;
  $('lmsLabel').textContent      = d.lms ?? 'Unknown LMS';
  $('statusBadge').textContent   = 'Ready';
  $('statusBadge').dataset.state = 'ready';

  // Show pre-existing status if available
  const pre = d.type === 'scorm12' ? d.currentStatus : d.currentComp;
  const preEl = $('priorStatus');
  if (pre && preEl) {
    preEl.textContent = pre ? `Prior status: ${pre}` : '';
    preEl.style.display = pre ? '' : 'none';
  }
}

function appendLog(entries, stagger = true) {
  const container = $('logEntries');
  if (!container) return;

  entries.forEach((entry, i) => {
    const el = document.createElement('div');
    el.className = 'le';
    el.style.animationDelay = stagger ? `${i * 30}ms` : '0ms';

    switch (entry.t) {
      case 'h':
        el.innerHTML = `<span class="le-h">${esc(entry.m)}</span>`;
        el.classList.add('le--head');
        break;
      case 'kv':
        el.innerHTML =
          `<span class="le-k">${esc(entry.k)}</span>` +
          `<span class="le-sep"> › </span>` +
          `<span class="le-v">${colorVal(entry.v)}</span>`;
        break;
      case 'ok':
        el.innerHTML = `<span class="le-ok">✓</span> <span>${esc(entry.m)}</span>`;
        el.classList.add('le--ok');
        break;
      case 'w':
        el.innerHTML = `<span class="le-w">⚠</span> <span>${esc(entry.m)}</span>`;
        el.classList.add('le--warn');
        break;
      case 'e':
        el.innerHTML = `<span class="le-e">✗</span> <span>${esc(entry.m)}</span>`;
        el.classList.add('le--err');
        break;
      case 'n':
        el.innerHTML = `<span class="le-n">${esc(entry.m)}</span>`;
        el.classList.add('le--note');
        break;
      default:
        el.textContent = entry.m ?? '';
    }
    container.appendChild(el);
  });

  const delay = stagger ? entries.length * 30 + 100 : 60;
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, delay);
  updateLogCount();
}

function colorVal(v) {
  const s = esc(String(v));
  // Highlight "true" green, "false" red, error codes amber
  if (s === 'true')  return `<span class="lv-true">${s}</span>`;
  if (s === 'false') return `<span class="lv-false">${s}</span>`;
  if (/→\s+false/.test(s)) return s.replace(/(→\s+)(false)/, '$1<span class="lv-false">$2</span>');
  if (/→\s+true/.test(s))  return s.replace(/(→\s+)(true)/,  '$1<span class="lv-true">$2</span>');
  if (/passed|completed/.test(s)) return `<span class="lv-pass">${s}</span>`;
  return s;
}

function updateLogCount() {
  const n = $('logEntries')?.children.length ?? 0;
  const el = $('logCount');
  if (el) el.textContent = String(n);
}

function clearLog() {
  const c = $('logEntries');
  if (c) c.innerHTML = '';
  updateLogCount();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════════════════════════
//  QUICK SETTINGS (score + time displayed inline in popup)
// ════════════════════════════════════════════════════════════════════════════
function syncQuickSettings() {
  const scoreEl = $('qScore');
  const timeEl  = $('qTime');
  if (scoreEl) scoreEl.value = state.settings.score;
  if (timeEl)  timeEl.value  = state.settings.sessionMinutes;
}

function bindQuickSettings() {
  $('qScore')?.addEventListener('change', e => {
    let v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 0)   v = 0;
    if (v > 100) v = 100;
    e.target.value = v;
    state.settings.score = v;
    chrome.storage.sync.set({ score: v });
  });
  $('qTime')?.addEventListener('change', e => {
    let v = parseFloat(e.target.value);
    if (isNaN(v) || v < 0)   v = 0;
    if (v > 999) v = 999;
    e.target.value = v;
    state.settings.sessionMinutes = v;
    chrome.storage.sync.set({ sessionMinutes: v });
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  SCAN + RETRY LOOP
// ════════════════════════════════════════════════════════════════════════════
async function runScan(isRetry = false) {
  if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
  if (!isRetry) {
    state.scanAttempt = 0;
    state.detected    = null;
    clearLog();
  }

  state.scanAttempt++;
  setPhase('scanning');
  showCard('cardScanning');
  $('scanBtn').disabled = true;

  await sleep(80);

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: state.tab.id, allFrames: true },
      func:   _detect,
      world:  'MAIN',
    });
  } catch (err) {
    appendLog([
      { t: 'e', m: `Script injection failed: ${err.message}` },
      { t: 'w', m: 'This can happen on chrome://, extension://, or file:// pages — open an actual LMS tab.' },
    ]);
    showCard('cardNotFound');
    setPhase('not-found');
    $('scanBtn').disabled = false;
    return;
  }

  const frames = (results || []).filter(r => r.result != null).map(r => ({ frameId: r.frameId, ...r.result }));

  const logs = [];
  if (state.scanAttempt === 1) {
    logs.push({ t: 'kv', k: 'Scan attempt', v: String(state.scanAttempt) });
    logs.push({ t: 'kv', k: 'Frames found', v: String(frames.length) });
  } else {
    logs.push({ t: 'kv', k: 'Re-scan attempt', v: `${state.scanAttempt} of ${state.settings.retryCount}` });
  }

  let detected = null;

  for (const f of frames) {
    if (f.s2004 && !detected) {
      detected = { type: 'scorm2004', frameId: f.frameId, lms: null, version: null, currentStatus: f.currentComp, currentScore: f.currentScore };
      logs.push({ t: 'ok', m: `SCORM 2004 API found  [${f.s2004Loc}]` });
      logs.push({ t: 'kv', k: 'Frame', v: f.url.slice(0, 90) });
    } else if (f.s12 && !detected) {
      detected = { type: 'scorm12',   frameId: f.frameId, lms: null, version: null, currentStatus: f.currentStatus, currentScore: f.currentScore };
      logs.push({ t: 'ok', m: `SCORM 1.2 API found  [${f.s12Loc}]` });
      logs.push({ t: 'kv', k: 'Frame', v: f.url.slice(0, 90) });
    }
    if (f.xapi) logs.push({ t: 'w', m: `xAPI/TinCan signal: "${f.xapi}" — may coexist with SCORM` });
    if (f.aicc) logs.push({ t: 'w', m: 'AICC launch params detected — server-side only' });
  }

  const lmsFrame = frames.find(f => f.lms);
  if (lmsFrame && detected) {
    detected.lms = lmsFrame.lms;
    logs.push({ t: 'kv', k: 'LMS', v: lmsFrame.lms });
  }

  if (detected?.currentStatus && detected.type === 'scorm12') {
    logs.push({ t: 'kv', k: 'Current status', v: detected.currentStatus });
  }
  if (detected?.currentScore) {
    logs.push({ t: 'kv', k: 'Current score', v: detected.currentScore });
  }

  appendLog(logs);

  if (detected) {
    state.detected = detected;
    updateResultCard(detected);
    showCard('cardResult');
    setPhase('ready');
    $('scanBtn').disabled = false;

    if (state.settings.autoComplete && state.scanAttempt === 1) {
      appendLog([{ t: 'w', m: 'Auto-complete enabled — triggering completion…' }], false);
      await sleep(400);
      runCompletion();
    }
    return;
  }

  // No SCORM found
  const anyXAPI = frames.some(f => f.xapi);
  const anyAICC = frames.some(f => f.aicc);
  const maxRetries = state.settings.retryCount;

  if (!anyXAPI && !anyAICC && state.scanAttempt < maxRetries) {
    // Schedule retry with countdown
    const delay = state.settings.retryDelayMs;
    showCard('cardRetrying');
    setPhase('retrying');
    $('scanBtn').disabled = false;

    let remaining = Math.ceil(delay / 1000);
    const countEl = $('retryCount');
    const retryNumEl = $('retryAttempt');
    if (retryNumEl) retryNumEl.textContent = `Attempt ${state.scanAttempt} of ${maxRetries}`;
    if (countEl) countEl.textContent = `${remaining}s`;

    const ticker = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      if (countEl) countEl.textContent = `${remaining}s`;
    }, 1000);

    state.retryTimer = setTimeout(() => {
      clearInterval(ticker);
      runScan(true);
    }, delay);

    appendLog([{ t: 'w', m: `No SCORM API yet — retrying in ${Math.ceil(delay/1000)}s (attempt ${state.scanAttempt}/${maxRetries})` }], false);

  } else {
    // Give up
    if (anyXAPI) {
      appendLog([
        { t: 'e', m: 'xAPI/cmi5 only — completion requires an authenticated LRS statement' },
        { t: 'w', m: 'Cannot complete from the browser. Use your LRS admin panel or check if a SCORM shim is configured.' },
      ], false);
      showCard('cardUnsupported');
      setPhase('unsupported');
    } else if (anyAICC) {
      appendLog([
        { t: 'e', m: 'AICC detected — server-side HACP protocol, cannot complete from browser' },
        { t: 'w', m: 'Use your LMS admin panel to force-complete this course.' },
      ], false);
      showCard('cardUnsupported');
      setPhase('unsupported');
    } else {
      appendLog([
        { t: 'e', m: `No SCORM API found after ${state.scanAttempt} scan attempt${state.scanAttempt > 1 ? 's' : ''}` },
        { t: 'n', m: 'Possible causes:' },
        { t: 'w', m: '1 — Course not loaded yet — click Re-scan once the course is open' },
        { t: 'w', m: '2 — Course iframe is cross-origin (CDN) — switch DevTools context to the iframe' },
        { t: 'w', m: '3 — xAPI/cmi5 only with no SCORM shim' },
        { t: 'w', m: '4 — Proprietary LMS tracking (no SCORM exposed)' },
        { t: 'w', m: '5 — HTML page with no tracking at all' },
      ], false);
      showCard('cardNotFound');
      setPhase('not-found');
    }
    $('scanBtn').disabled = false;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  COMPLETION
// ════════════════════════════════════════════════════════════════════════════
async function runCompletion() {
  if (!state.detected && state.phase !== 'error') return;

  setPhase('completing');
  $('scanBtn').disabled = true;
  await sleep(60);

  const d    = state.detected;
  const s    = state.settings;
  const is12 = d.type === 'scorm12';

  const opts = {
    score:           s.score,
    sessionMinutes:  s.sessionMinutes,
    preferredStatus: s.scorm12Status === 'auto' ? 'passed' : s.scorm12Status,
    clearSuspend:    s.clearSuspendData,
    verify:          s.verifyAfter,
  };

  appendLog([{ t: 'h', m: `Executing ${is12 ? 'SCORM 1.2' : 'SCORM 2004'} completion  ·  score ${opts.score}  ·  ${opts.sessionMinutes}min` }], false);

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: state.tab.id, frameIds: [d.frameId] },
      func:   is12 ? _completeSCORM12 : _completeSCORM2004,
      args:   [opts],
      world:  'MAIN',
    });
  } catch (err) {
    appendLog([
      { t: 'e', m: `Injection failed: ${err.message}` },
      { t: 'w', m: 'The frame may have navigated. Click Re-scan and try again.' },
    ]);
    setPhase('error');
    $('scanBtn').disabled = false;
    return;
  }

  const log = results?.[0]?.result ?? [];
  if (!log.length) {
    appendLog([{ t: 'e', m: 'Completion function returned no output (unexpected)' }]);
    setPhase('error');
    $('scanBtn').disabled = false;
    return;
  }

  appendLog(log);

  const hasError = log.some(e => e.t === 'e');
  if (hasError) {
    setPhase('error');
    $('scanBtn').disabled = false;
  } else {
    setPhase('done');
    // Flip the status badge in the result card
    const sb = $('statusBadge');
    if (sb) { sb.textContent = 'Complete'; sb.dataset.state = 'done'; }
    // Save to history
    await saveHistory(d, opts);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  HISTORY
// ════════════════════════════════════════════════════════════════════════════
async function saveHistory(detected, opts) {
  try {
    const data = await chrome.storage.local.get({ history: [] });
    const history = data.history || [];
    history.unshift({
      ts:    Date.now(),
      url:   state.tab?.url ?? '',
      title: state.tab?.title ?? '',
      type:  detected.type,
      lms:   detected.lms ?? null,
      score: opts.score,
    });
    // Keep last 50
    if (history.length > 50) history.length = 50;
    await chrome.storage.local.set({ history });
  } catch (_) { /* non-critical */ }
}

// ════════════════════════════════════════════════════════════════════════════
//  COPY LOG
// ════════════════════════════════════════════════════════════════════════════
function copyLog() {
  const entries = [...($('logEntries')?.querySelectorAll('.le') ?? [])];
  const text = entries.map(el => el.textContent.trim()).join('\n');
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('copyBtn');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.classList.add('copy--done');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copy--done'); }, 2000);
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  UTIL
// ════════════════════════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ════════════════════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  try {
    const saved = await chrome.storage.sync.get(DEFAULTS);
    state.settings = { ...DEFAULTS, ...saved };
  } catch (_) {
    state.settings = { ...DEFAULTS };
  }

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.tab = tab;

  // Header URL
  const urlEl = $('tabUrl');
  if (urlEl && tab?.url) {
    try {
      const u = new URL(tab.url);
      urlEl.textContent = u.hostname;
    } catch (_) {
      urlEl.textContent = (tab.url || '').slice(0, 40);
    }
  }

  // Tagline toggle
  const taglineEl = $('tagline');
  if (taglineEl) {
    taglineEl.style.display = state.settings.showTagline ? '' : 'none';
  }

  // Quick settings
  syncQuickSettings();
  bindQuickSettings();

  // Wire buttons
  $('scanBtn').addEventListener('click', () => runScan(false));
  $('completeBtn').addEventListener('click', runCompletion);
  $('copyBtn').addEventListener('click', copyLog);
  $('optionsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());

  // Auto-scan
  if (state.settings.autoScan) {
    await runScan(false);
  } else {
    setPhase('idle');
    showCard('cardScanning');
    $('scanBtn').disabled = false;
  }
});

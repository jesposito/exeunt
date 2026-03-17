'use strict';

// ============================================================================
//  Exeunt Demo Course -- SCORM API Stubs
//  Provides realistic window.API (SCORM 1.2) and window.API_1484_11 (SCORM 2004)
//  Only ONE is exposed at a time depending on the active mode.
// ============================================================================

// Log callback -- UI replaces this to receive events
window._scormApiLog = window._scormApiLog || function () {};

// ----------------------------------------------------------------------------
//  SCORM 1.2 Error Codes
// ----------------------------------------------------------------------------
const SCORM12_ERRORS = {
  '0':   'No error',
  '101': 'Already initialized',
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

// ----------------------------------------------------------------------------
//  SCORM 2004 Error Codes
// ----------------------------------------------------------------------------
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
  '391': 'Completion status error',
  '401': 'Undefined data model element',
  '402': 'Unimplemented data model element',
  '403': 'Data model element value not initialized',
  '404': 'Data model element is read only',
  '405': 'Data model element is write only',
  '406': 'Data model element type mismatch',
};

// ----------------------------------------------------------------------------
//  Factory helpers
// ----------------------------------------------------------------------------

function _log(method, args, ret, errCode) {
  window._scormApiLog({ method, args: Array.from(args), ret, errCode, ts: Date.now() });
}

// ----------------------------------------------------------------------------
//  SCORM 1.2 API Factory
// ----------------------------------------------------------------------------
function createScorm12Api() {
  // States: 'not-initialized' | 'initialized' | 'terminated'
  let state = 'not-initialized';
  let lastError = '0';

  const cmi = {
    'cmi.core.lesson_status':   'not attempted',
    'cmi.core.score.raw':       '',
    'cmi.core.score.min':       '0',
    'cmi.core.score.max':       '100',
    'cmi.core.session_time':    '0000:00:00.00',
    'cmi.core.lesson_location': '',
    'cmi.core.exit':            '',
    'cmi.suspend_data':         '',
  };

  function setError(code) { lastError = String(code); }
  function clearError()   { lastError = '0'; }

  const api = {
    LMSInitialize(param) {
      if (state === 'initialized') {
        setError('101');
        _log('LMSInitialize', [param], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('203');
        _log('LMSInitialize', [param], 'false', lastError);
        return 'false';
      }
      state = 'initialized';
      clearError();
      _log('LMSInitialize', [param], 'true', '0');
      return 'true';
    },

    LMSGetValue(element) {
      if (state !== 'initialized') {
        setError(state === 'not-initialized' ? '301' : '203');
        _log('LMSGetValue', [element], '', lastError);
        return '';
      }
      if (Object.prototype.hasOwnProperty.call(cmi, element)) {
        clearError();
        const val = cmi[element];
        _log('LMSGetValue', [element], val, '0');
        return val;
      }
      setError('401');
      _log('LMSGetValue', [element], '', lastError);
      return '';
    },

    LMSSetValue(element, value) {
      if (state !== 'initialized') {
        setError(state === 'not-initialized' ? '301' : '203');
        _log('LMSSetValue', [element, value], 'false', lastError);
        return 'false';
      }
      if (!Object.prototype.hasOwnProperty.call(cmi, element)) {
        setError('401');
        _log('LMSSetValue', [element, value], 'false', lastError);
        return 'false';
      }
      cmi[element] = String(value);
      clearError();
      _log('LMSSetValue', [element, value], 'true', '0');
      return 'true';
    },

    LMSCommit(param) {
      if (state !== 'initialized') {
        setError(state === 'not-initialized' ? '301' : '203');
        _log('LMSCommit', [param], 'false', lastError);
        return 'false';
      }
      clearError();
      _log('LMSCommit', [param], 'true', '0');
      return 'true';
    },

    LMSFinish(param) {
      if (state === 'not-initialized') {
        setError('301');
        _log('LMSFinish', [param], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('203');
        _log('LMSFinish', [param], 'false', lastError);
        return 'false';
      }
      state = 'terminated';
      clearError();
      _log('LMSFinish', [param], 'true', '0');
      return 'true';
    },

    LMSGetLastError() {
      _log('LMSGetLastError', [], lastError, lastError);
      return lastError;
    },

    LMSGetErrorString(code) {
      const str = SCORM12_ERRORS[String(code)] || 'Unknown error';
      _log('LMSGetErrorString', [code], str, '0');
      return str;
    },

    LMSGetDiagnostic(code) {
      const str = SCORM12_ERRORS[String(code)] || 'Unknown error';
      _log('LMSGetDiagnostic', [code], str, '0');
      return str;
    },

    // Expose state snapshot for UI
    _getState()  { return state; },
    _getCmi()    { return Object.assign({}, cmi); },
    _reset() {
      state = 'not-initialized';
      lastError = '0';
      Object.assign(cmi, {
        'cmi.core.lesson_status':   'not attempted',
        'cmi.core.score.raw':       '',
        'cmi.core.score.min':       '0',
        'cmi.core.score.max':       '100',
        'cmi.core.session_time':    '0000:00:00.00',
        'cmi.core.lesson_location': '',
        'cmi.core.exit':            '',
        'cmi.suspend_data':         '',
      });
    },
  };

  return api;
}

// ----------------------------------------------------------------------------
//  SCORM 2004 API Factory
// ----------------------------------------------------------------------------
function createScorm2004Api() {
  // States: 'not-initialized' | 'initialized' | 'terminated'
  let state = 'not-initialized';
  let lastError = '0';

  const cmi = {
    'cmi.completion_status': 'not attempted',
    'cmi.success_status':    'unknown',
    'cmi.score.raw':         '',
    'cmi.score.min':         '0',
    'cmi.score.max':         '100',
    'cmi.score.scaled':      '',
    'cmi.progress_measure':  '',
    'cmi.session_time':      'PT0M0S',
    'cmi.suspend_data':      '',
    'cmi.location':          '',
  };

  function setError(code) { lastError = String(code); }
  function clearError()   { lastError = '0'; }

  const api = {
    Initialize(param) {
      if (state === 'initialized') {
        setError('103');
        _log('Initialize', [param], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('104');
        _log('Initialize', [param], 'false', lastError);
        return 'false';
      }
      state = 'initialized';
      clearError();
      _log('Initialize', [param], 'true', '0');
      return 'true';
    },

    GetValue(element) {
      if (state === 'not-initialized') {
        setError('122');
        _log('GetValue', [element], '', lastError);
        return '';
      }
      if (state === 'terminated') {
        setError('123');
        _log('GetValue', [element], '', lastError);
        return '';
      }
      if (Object.prototype.hasOwnProperty.call(cmi, element)) {
        clearError();
        const val = cmi[element];
        _log('GetValue', [element], val, '0');
        return val;
      }
      setError('401');
      _log('GetValue', [element], '', lastError);
      return '';
    },

    SetValue(element, value) {
      if (state === 'not-initialized') {
        setError('132');
        _log('SetValue', [element, value], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('133');
        _log('SetValue', [element, value], 'false', lastError);
        return 'false';
      }
      if (!Object.prototype.hasOwnProperty.call(cmi, element)) {
        setError('401');
        _log('SetValue', [element, value], 'false', lastError);
        return 'false';
      }
      cmi[element] = String(value);
      clearError();
      _log('SetValue', [element, value], 'true', '0');
      return 'true';
    },

    Commit(param) {
      if (state === 'not-initialized') {
        setError('142');
        _log('Commit', [param], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('143');
        _log('Commit', [param], 'false', lastError);
        return 'false';
      }
      clearError();
      _log('Commit', [param], 'true', '0');
      return 'true';
    },

    Terminate(param) {
      if (state === 'not-initialized') {
        setError('112');
        _log('Terminate', [param], 'false', lastError);
        return 'false';
      }
      if (state === 'terminated') {
        setError('113');
        _log('Terminate', [param], 'false', lastError);
        return 'false';
      }
      state = 'terminated';
      clearError();
      _log('Terminate', [param], 'true', '0');
      return 'true';
    },

    GetLastError() {
      _log('GetLastError', [], lastError, lastError);
      return lastError;
    },

    GetErrorString(code) {
      const str = SCORM2004_ERRORS[String(code)] || 'Unknown error';
      _log('GetErrorString', [code], str, '0');
      return str;
    },

    GetDiagnostic(code) {
      const str = SCORM2004_ERRORS[String(code)] || 'Unknown error';
      _log('GetDiagnostic', [code], str, '0');
      return str;
    },

    // Expose state snapshot for UI
    _getState()  { return state; },
    _getCmi()    { return Object.assign({}, cmi); },
    _reset() {
      state = 'not-initialized';
      lastError = '0';
      Object.assign(cmi, {
        'cmi.completion_status': 'not attempted',
        'cmi.success_status':    'unknown',
        'cmi.score.raw':         '',
        'cmi.score.min':         '0',
        'cmi.score.max':         '100',
        'cmi.score.scaled':      '',
        'cmi.progress_measure':  '',
        'cmi.session_time':      'PT0M0S',
        'cmi.suspend_data':      '',
        'cmi.location':          '',
      });
    },
  };

  return api;
}

// ----------------------------------------------------------------------------
//  Active instances -- initialised on first use, reset on mode switch
// ----------------------------------------------------------------------------
const _scorm12Api   = createScorm12Api();
const _scorm2004Api = createScorm2004Api();

// setMode: 'scorm12' | 'scorm2004'
// Exposes the chosen API on window and removes the other,
// then resets both to a clean state.
function setScormMode(mode) {
  // Remove both first so Exeunt sees a clean slate
  delete window.API;
  delete window.API_1484_11;

  _scorm12Api._reset();
  _scorm2004Api._reset();

  if (mode === 'scorm12') {
    window.API = _scorm12Api;
  } else {
    window.API_1484_11 = _scorm2004Api;
  }
}

// Export for use by index.html
window._scormDemo = {
  setScormMode,
  getScorm12Api()   { return _scorm12Api;   },
  getScorm2004Api() { return _scorm2004Api; },
};

// Default: SCORM 1.2 active
setScormMode('scorm12');

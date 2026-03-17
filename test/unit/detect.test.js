import { describe, it, expect } from 'vitest';
import { loadPopupFunctions } from '../setup.js';

function makeWindow(overrides = {}) {
  return {
    API: undefined,
    API_1484_11: undefined,
    top: overrides.top || {},
    parent: overrides.parent || {},
    pipwerks: undefined,
    ADL: undefined,
    TinCan: undefined,
    tincan: undefined,
    xAPI: undefined,
    cmi5: undefined,
    ...overrides,
  };
}

function makeLocation(overrides = {}) {
  return {
    href: 'http://example.com/',
    search: '',
    ...overrides,
  };
}

function makeDocument(overrides = {}) {
  return {
    title: '',
    body: { innerHTML: '' },
    querySelectorAll: () => [],
    ...overrides,
  };
}

describe('_detect - no APIs', () => {
  it('returns s12: false, s2004: false when no APIs present', () => {
    const { _detect } = loadPopupFunctions({
      location: makeLocation(),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.s12).toBe(false);
    expect(result.s2004).toBe(false);
  });
});

describe('_detect - SCORM 1.2', () => {
  it('detects window.API with LMSInitialize', () => {
    const api = { LMSInitialize: () => 'true', LMSGetLastError: () => '0', LMSGetValue: () => '' };
    const { _detect } = loadPopupFunctions({
      API: api,
      location: makeLocation(),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.s12).toBe(true);
    expect(result.s12Loc).toBe('window.API');
    expect(result.s2004).toBe(false);
  });
});

describe('_detect - SCORM 2004', () => {
  it('detects window.API_1484_11 with Initialize', () => {
    const api = { Initialize: () => 'true', GetLastError: () => '0', GetValue: () => '' };
    const { _detect } = loadPopupFunctions({
      API_1484_11: api,
      location: makeLocation(),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.s12).toBe(false);
    expect(result.s2004).toBe(true);
    expect(result.s2004Loc).toBe('window.API_1484_11');
  });
});

describe('_detect - both APIs', () => {
  it('detects both SCORM 1.2 and 2004 when both present', () => {
    const api12 = { LMSInitialize: () => 'true', LMSGetLastError: () => '0', LMSGetValue: () => '' };
    const api2004 = { Initialize: () => 'true', GetLastError: () => '0', GetValue: () => '' };
    const { _detect } = loadPopupFunctions({
      API: api12,
      API_1484_11: api2004,
      location: makeLocation(),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.s12).toBe(true);
    expect(result.s2004).toBe(true);
  });
});

describe('_detect - xAPI', () => {
  it('detects ADL global as xapi signal', () => {
    const { _detect } = loadPopupFunctions({
      ADL: { XAPIWrapper: {} },
      location: makeLocation(),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.xapi).toBe('ADL');
  });
});

describe('_detect - AICC', () => {
  it('detects AICC_URL query param', () => {
    const { _detect } = loadPopupFunctions({
      location: makeLocation({
        href: 'http://example.com/?AICC_URL=http://lms.example.com/aicc',
        search: '?AICC_URL=http://lms.example.com/aicc',
      }),
      document: makeDocument(),
    });
    const result = _detect();
    expect(result.aicc).toBe(true);
  });
});

describe('_detect - LMS sniff', () => {
  it('identifies Moodle from URL', () => {
    const { _detect } = loadPopupFunctions({
      location: makeLocation({
        href: 'https://moodle.example.com/mod/scorm/player.php',
        search: '',
      }),
      document: makeDocument({ title: 'Course Player' }),
    });
    const result = _detect();
    expect(result.lms).toBe('Moodle');
  });
});

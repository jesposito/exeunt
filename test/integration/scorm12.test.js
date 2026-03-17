import { describe, it, expect, beforeEach } from 'vitest';
import { loadPopupFunctions } from '../setup.js';

function makeScorm12Stub() {
  const calls = [];
  const values = {};

  const stub = {
    LMSInitialize: (v) => { calls.push(['LMSInitialize', v]); return 'true'; },
    LMSGetLastError: () => '0',
    LMSGetValue: (field) => {
      calls.push(['LMSGetValue', field]);
      return values[field] || '';
    },
    LMSSetValue: (field, value) => {
      calls.push(['LMSSetValue', field, value]);
      values[field] = value;
      return 'true';
    },
    LMSCommit: (v) => { calls.push(['LMSCommit', v]); return 'true'; },
    LMSFinish: (v) => { calls.push(['LMSFinish', v]); return 'true'; },
    _calls: calls,
    _values: values,
  };

  return stub;
}

describe('_completeSCORM12 - basic completion', () => {
  let api;
  let log;

  beforeEach(() => {
    api = makeScorm12Stub();
    const { _completeSCORM12 } = loadPopupFunctions({ API: api });
    log = _completeSCORM12({
      score: 85,
      sessionMinutes: 5,
      preferredStatus: 'passed',
      clearSuspend: false,
      verify: true,
    });
  });

  it('returns an array of log entries', () => {
    expect(Array.isArray(log)).toBe(true);
    expect(log.length).toBeGreaterThan(0);
  });

  it('calls LMSInitialize', () => {
    const init = api._calls.find(c => c[0] === 'LMSInitialize');
    expect(init).toBeDefined();
  });

  it('sets score.min to 0', () => {
    const call = api._calls.find(c => c[0] === 'LMSSetValue' && c[1] === 'cmi.core.score.min');
    expect(call).toBeDefined();
    expect(call[2]).toBe('0');
  });

  it('sets score.max to 100', () => {
    const call = api._calls.find(c => c[0] === 'LMSSetValue' && c[1] === 'cmi.core.score.max');
    expect(call).toBeDefined();
    expect(call[2]).toBe('100');
  });

  it('sets score.raw to 85', () => {
    const call = api._calls.find(c => c[0] === 'LMSSetValue' && c[1] === 'cmi.core.score.raw');
    expect(call).toBeDefined();
    expect(call[2]).toBe('85');
  });

  it('sets lesson_status to passed', () => {
    const call = api._calls.find(c => c[0] === 'LMSSetValue' && c[1] === 'cmi.core.lesson_status');
    expect(call).toBeDefined();
    expect(call[2]).toBe('passed');
  });

  it('sets session_time', () => {
    const call = api._calls.find(c => c[0] === 'LMSSetValue' && c[1] === 'cmi.core.session_time');
    expect(call).toBeDefined();
    expect(call[2]).toBe('0005:00:00.00');
  });

  it('calls LMSCommit', () => {
    const call = api._calls.find(c => c[0] === 'LMSCommit');
    expect(call).toBeDefined();
  });

  it('calls LMSFinish', () => {
    const call = api._calls.find(c => c[0] === 'LMSFinish');
    expect(call).toBeDefined();
  });

  it('has no error entries in log', () => {
    const errors = log.filter(e => e.t === 'e');
    expect(errors).toHaveLength(0);
  });
});

describe('_completeSCORM12 - passed to completed fallback', () => {
  it('retries with completed when passed is rejected', () => {
    const calls = [];
    const api = {
      LMSInitialize: () => 'true',
      LMSGetLastError: () => '405',
      LMSGetValue: (field) => '',
      LMSSetValue: (field, value) => {
        calls.push([field, value]);
        // Reject "passed", accept "completed"
        if (field === 'cmi.core.lesson_status' && value === 'passed') return 'false';
        return 'true';
      },
      LMSCommit: () => 'true',
      LMSFinish: () => 'true',
    };

    const { _completeSCORM12 } = loadPopupFunctions({ API: api });
    const log = _completeSCORM12({
      score: 80,
      sessionMinutes: 3,
      preferredStatus: 'passed',
      clearSuspend: false,
      verify: false,
    });

    const statusCalls = calls.filter(c => c[0] === 'cmi.core.lesson_status');
    expect(statusCalls.length).toBeGreaterThanOrEqual(2);
    expect(statusCalls[0][1]).toBe('passed');
    expect(statusCalls[1][1]).toBe('completed');
  });
});

describe('_completeSCORM12 - clearSuspend option', () => {
  it('sets suspend_data to empty string when clearSuspend is true', () => {
    const calls = [];
    const values = {};
    const api = {
      LMSInitialize: () => 'true',
      LMSGetLastError: () => '0',
      LMSGetValue: (field) => values[field] || '',
      LMSSetValue: (field, value) => { calls.push([field, value]); values[field] = value; return 'true'; },
      LMSCommit: () => 'true',
      LMSFinish: () => 'true',
    };

    const { _completeSCORM12 } = loadPopupFunctions({ API: api });
    _completeSCORM12({
      score: 100,
      sessionMinutes: 1,
      preferredStatus: 'passed',
      clearSuspend: true,
      verify: false,
    });

    const suspendCall = calls.find(c => c[0] === 'cmi.suspend_data');
    expect(suspendCall).toBeDefined();
    expect(suspendCall[1]).toBe('');
  });
});

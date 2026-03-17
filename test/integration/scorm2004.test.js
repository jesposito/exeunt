import { describe, it, expect, beforeEach } from 'vitest';
import { loadPopupFunctions } from '../setup.js';

function makeScorm2004Stub() {
  const calls = [];
  const values = {};

  const stub = {
    Initialize: (v) => { calls.push(['Initialize', v]); return 'true'; },
    GetLastError: () => '0',
    GetValue: (field) => { calls.push(['GetValue', field]); return values[field] || ''; },
    SetValue: (field, value) => {
      calls.push(['SetValue', field, value]);
      values[field] = value;
      return 'true';
    },
    Commit: (v) => { calls.push(['Commit', v]); return 'true'; },
    Terminate: (v) => { calls.push(['Terminate', v]); return 'true'; },
    _calls: calls,
    _values: values,
  };

  return stub;
}

describe('_completeSCORM2004 - basic completion', () => {
  let api;
  let log;

  beforeEach(() => {
    api = makeScorm2004Stub();
    const { _completeSCORM2004 } = loadPopupFunctions({ API_1484_11: api });
    log = _completeSCORM2004({
      score: 90,
      sessionMinutes: 10,
      clearSuspend: false,
      verify: true,
    });
  });

  it('returns an array of log entries', () => {
    expect(Array.isArray(log)).toBe(true);
    expect(log.length).toBeGreaterThan(0);
  });

  it('calls Initialize', () => {
    const call = api._calls.find(c => c[0] === 'Initialize');
    expect(call).toBeDefined();
  });

  it('sets score.min to 0', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.score.min');
    expect(call).toBeDefined();
    expect(call[2]).toBe('0');
  });

  it('sets score.max to 100', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.score.max');
    expect(call).toBeDefined();
    expect(call[2]).toBe('100');
  });

  it('sets score.raw to 90', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.score.raw');
    expect(call).toBeDefined();
    expect(call[2]).toBe('90');
  });

  it('sets score.scaled to 0.9000', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.score.scaled');
    expect(call).toBeDefined();
    expect(call[2]).toBe('0.9000');
  });

  it('sets progress_measure to 1', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.progress_measure');
    expect(call).toBeDefined();
    expect(call[2]).toBe('1');
  });

  it('sets completion_status to completed', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.completion_status');
    expect(call).toBeDefined();
    expect(call[2]).toBe('completed');
  });

  it('sets success_status to passed', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.success_status');
    expect(call).toBeDefined();
    expect(call[2]).toBe('passed');
  });

  it('sets session_time', () => {
    const call = api._calls.find(c => c[0] === 'SetValue' && c[1] === 'cmi.session_time');
    expect(call).toBeDefined();
    expect(call[2]).toBe('PT10M0S');
  });

  it('calls Commit', () => {
    const call = api._calls.find(c => c[0] === 'Commit');
    expect(call).toBeDefined();
  });

  it('calls Terminate', () => {
    const call = api._calls.find(c => c[0] === 'Terminate');
    expect(call).toBeDefined();
  });

  it('has no error entries in log', () => {
    const errors = log.filter(e => e.t === 'e');
    expect(errors).toHaveLength(0);
  });
});

describe('_completeSCORM2004 - already initialized (error 103)', () => {
  it('continues without aborting when Initialize returns error 103', () => {
    const calls = [];
    const values = {};
    const api = {
      Initialize: () => { calls.push('Initialize'); return 'false'; },
      GetLastError: () => '103',
      GetValue: (field) => values[field] || '',
      SetValue: (field, value) => { calls.push(['SetValue', field, value]); values[field] = value; return 'true'; },
      Commit: () => 'true',
      Terminate: () => 'true',
    };

    const { _completeSCORM2004 } = loadPopupFunctions({ API_1484_11: api });
    const log = _completeSCORM2004({
      score: 75,
      sessionMinutes: 5,
      clearSuspend: false,
      verify: false,
    });

    // Should have continued - completion_status should have been set
    const completionCall = calls.find(c => Array.isArray(c) && c[1] === 'cmi.completion_status');
    expect(completionCall).toBeDefined();

    // No hard errors (warnings are ok for error 103)
    const hardErrors = log.filter(e => e.t === 'e');
    expect(hardErrors).toHaveLength(0);
  });
});

describe('_completeSCORM2004 - already terminated (error 104)', () => {
  it('aborts with error when Initialize returns error 104', () => {
    const api = {
      Initialize: () => 'false',
      GetLastError: () => '104',
      GetValue: () => '',
      SetValue: () => 'true',
      Commit: () => 'true',
      Terminate: () => 'true',
    };

    const { _completeSCORM2004 } = loadPopupFunctions({ API_1484_11: api });
    const log = _completeSCORM2004({
      score: 75,
      sessionMinutes: 5,
      clearSuspend: false,
      verify: false,
    });

    const errors = log.filter(e => e.t === 'e');
    expect(errors.length).toBeGreaterThan(0);
    // Log should be short - it aborted early
    expect(log.length).toBeLessThan(5);
  });
});

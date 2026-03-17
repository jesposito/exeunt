import { describe, it, expect } from 'vitest';
import { loadPopupFunctions } from '../setup.js';

const { formatHHMMSS, formatPT } = loadPopupFunctions();

describe('formatHHMMSS', () => {
  it('formats whole minutes', () => {
    expect(formatHHMMSS(5)).toBe('0005:00:00.00');
  });

  it('formats zero minutes', () => {
    expect(formatHHMMSS(0)).toBe('0000:00:00.00');
  });

  it('formats 60 minutes', () => {
    expect(formatHHMMSS(60)).toBe('0060:00:00.00');
  });

  it('formats fractional minutes into seconds', () => {
    expect(formatHHMMSS(5.5)).toBe('0005:30:00.00');
  });

  it('pads minutes to 4 digits', () => {
    expect(formatHHMMSS(999)).toBe('0999:00:00.00');
  });

  it('formats half a minute', () => {
    expect(formatHHMMSS(0.5)).toBe('0000:30:00.00');
  });

  it('formats 1.75 minutes', () => {
    expect(formatHHMMSS(1.75)).toBe('0001:45:00.00');
  });
});

describe('formatPT', () => {
  it('formats whole minutes', () => {
    expect(formatPT(5)).toBe('PT5M0S');
  });

  it('formats zero minutes', () => {
    expect(formatPT(0)).toBe('PT0M0S');
  });

  it('formats 60 minutes', () => {
    expect(formatPT(60)).toBe('PT60M0S');
  });

  it('includes seconds when fractional', () => {
    expect(formatPT(5.5)).toBe('PT5M30S');
  });

  it('formats half a minute', () => {
    expect(formatPT(0.5)).toBe('PT0M30S');
  });

  it('formats 1.75 minutes', () => {
    expect(formatPT(1.75)).toBe('PT1M45S');
  });
});

import { describe, it, expect } from 'vitest';
import { loadPopupFunctions } from '../setup.js';

const { SCORM12_ERRORS, SCORM2004_ERRORS } = loadPopupFunctions();

describe('SCORM12_ERRORS', () => {
  const expectedCodes = ['0', '101', '201', '202', '203', '301', '401', '402', '403', '404', '405'];

  it('contains all expected error codes', () => {
    for (const code of expectedCodes) {
      expect(SCORM12_ERRORS).toHaveProperty(code);
    }
  });

  it('maps code 0 to "No error"', () => {
    expect(SCORM12_ERRORS['0']).toBe('No error');
  });

  it('has non-empty strings for all values', () => {
    for (const [code, msg] of Object.entries(SCORM12_ERRORS)) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

describe('SCORM2004_ERRORS', () => {
  const expectedCodes = [
    '0', '102', '103', '104',
    '111', '112', '113',
    '122', '123', '132', '133',
    '142', '143',
    '391',
    '401', '402', '403', '404', '405', '406',
  ];

  it('contains all expected error codes', () => {
    for (const code of expectedCodes) {
      expect(SCORM2004_ERRORS).toHaveProperty(code);
    }
  });

  it('maps code 0 to "No error"', () => {
    expect(SCORM2004_ERRORS['0']).toBe('No error');
  });

  it('has non-empty strings for all values', () => {
    for (const [code, msg] of Object.entries(SCORM2004_ERRORS)) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

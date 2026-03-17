import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads the testable functions from extension/popup.js.
 *
 * popup.js does not export anything - it is a vanilla browser script with a
 * DOMContentLoaded boot block at the bottom. We extract only the pure/page-
 * injected portion (everything before the STATE section) so that the chrome
 * and DOM boot code never executes.
 *
 * The extracted source is evaluated inside a Function wrapper that receives
 * the globals the page-injected functions need (window, document, location)
 * and returns the functions by name.
 *
 * Security note: this only ever evaluates the local extension source file -
 * no user-provided strings are passed to the Function constructor.
 */
export function loadPopupFunctions(windowOverride = {}) {
  const source = readFileSync(
    resolve(__dirname, '../extension/popup.js'),
    'utf-8'
  );

  // Extract everything up to the STATE section banner.
  // This avoids the chrome / DOM-heavy boot code that runs at page load.
  let cutoff = source.length;
  const stateIdx = source.indexOf('//  STATE');
  if (stateIdx !== -1) {
    const lineStart = source.lastIndexOf('\n', stateIdx);
    cutoff = lineStart;
  }

  const trimmed = source.slice(0, cutoff);

  // Build a minimal window-like object that merges any per-test overrides.
  const win = Object.assign(
    {
      API: undefined,
      API_1484_11: undefined,
      top: {},
      parent: {},
      pipwerks: undefined,
      ADL: undefined,
      TinCan: undefined,
      tincan: undefined,
      xAPI: undefined,
      cmi5: undefined,
    },
    windowOverride
  );

  // Minimal location
  const loc = windowOverride.location || {
    href: 'http://example.com/',
    search: '',
  };

  // Minimal document
  const doc = windowOverride.document || {
    title: '',
    body: { innerHTML: '' },
    querySelectorAll: () => [],
  };

  // Wrap source so top-level declarations become local variables/functions,
  // then return exactly the symbols we need.
  // We shadow `window`, `location`, and `document` so injected functions
  // use the values we pass in rather than jsdom globals.
  // Only the trusted local source file is ever evaluated here.
  // eslint-disable-next-line no-new-func
  const wrapper = new Function( // NOSONAR - trusted local source only
    'window', 'location', 'document',
    trimmed + '\nreturn { formatHHMMSS, formatPT, SCORM12_ERRORS, SCORM2004_ERRORS, _detect, _completeSCORM12, _completeSCORM2004 };'
  );

  return wrapper(win, loc, doc);
}

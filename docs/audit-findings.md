# Exeunt UI/UX Audit -- Consolidated Findings

**Date:** 2026-03-17
**Audited version:** 1.3.0 (manifest.json)
**Agents:** 6 parallel auditors (Visual Design, UX/Interaction, Content/Copy, Accessibility, Responsive/Cross-Platform, Performance/Code Quality)

---

## Executive Summary

Exeunt is a well-crafted Chrome MV3 extension with a distinctive editorial voice, strong visual identity, and a functional state machine. Across six parallel audits covering visual design, UX, content, accessibility, responsive layout, and code quality, the codebase shows the work of a careful developer -- but also the drift that accumulates when four UI surfaces evolve independently without a shared design token source.

The two most serious issues found are a **confirmed XSS vulnerability** in the options page history rendering (unescaped `item.title` from webpage-controlled `document.title` injected into `innerHTML`) and a **setInterval leak** in the popup retry countdown that causes erratic display when Re-scan is clicked mid-countdown. Both are straightforward fixes.

Beyond those, the dominant theme is **consistency drift**: the popup uses `--bg: #050b12` while the other three surfaces use `#060c14`; the extension surfaces use brighter text colors than the docs pages; the options page has zero responsive breakpoints despite opening in a full browser tab; and the popup's `done` state is a dead end with no Re-scan path for testers who need to complete courses repeatedly. The store assets depict a different UI than what ships, but the user has decided to eliminate images entirely and rely on copy alone -- which is addressed in the Store Copy Rework section below.

---

## Priority Matrix

### P0 -- Critical (security impact or blocks accessibility)

**1. XSS via unescaped tab title in history rendering**
- **File:** `extension/options.js` line 124
- **Fix:** The `item.title` field (sourced from `document.title` of visited pages, which is attacker-controlled) is interpolated raw into `container.innerHTML`. Pass it through an HTML escape function before interpolation. The `esc()` function already exists in `popup.js` lines 578-582 -- either extract it to a shared utility or duplicate it in options.js. Also escape `item.lms` (line 121) and `domain` (line 123) defensively.
- **Effort:** S (small -- one function, three call sites)

**2. No keyboard focus management in popup**
- **Files:** `extension/popup.html`, `extension/popup.css`, `extension/popup.js`
- **Fix:** The popup has no `:focus-visible` styles on interactive elements. The `.icon-btn`, `.btn--ghost`, `.btn--primary`, `.copy-btn`, and `.qs-input` elements all lack visible focus indicators. Add `outline: 2px solid var(--teal); outline-offset: 2px` on `:focus-visible` for all interactive elements. The phase dot, brand text, and log entries are not interactive and do not need focus styles.
- **Effort:** S (CSS-only, ~10 lines across popup.css and options.css)

**3. No ARIA roles or live regions for state changes**
- **Files:** `extension/popup.html`, `extension/popup.js`
- **Fix:** When the popup transitions between phases (scanning, retrying, ready, done, error, not-found), the detection card content changes but screen readers are not notified. Add `role="status"` and `aria-live="polite"` to the `.detection-card` container. Add `aria-label` to the phase dot (`<div class="phase-dot" role="img" aria-label="Status: idle">`). Update the `setPhase()` function in popup.js to also update the phase-dot aria-label.
- **Effort:** S (HTML attributes + one JS line in setPhase)

**4. Missing accessible names on icon buttons**
- **Files:** `extension/popup.html`, `extension/options.html`
- **Fix:** The settings button (popup.html line 19) has `title="Settings"` but no `aria-label`. The `title` attribute is not announced by all screen readers. Add `aria-label="Settings"` to the icon button. The Re-scan button (line 111) uses `text content "Re-scan"` which is fine. The Copy button (line 104) has text content "Copy" which is fine. Check all icon-only buttons across surfaces.
- **Effort:** S

### P1 -- Major (significant UX or quality issue)

**5. `ticker` setInterval leak on Re-scan click**
- **File:** `extension/popup.js` lines 723-730
- **Fix:** The countdown `ticker` setInterval ID is stored only in a local closure variable. When the user clicks Re-scan during countdown, `clearTimeout(state.retryTimer)` runs (line 617) but the `ticker` interval is never cleared -- it continues running, fighting with new intervals if the user Re-scans repeatedly. Store `ticker` on `state` (e.g., `state.tickerInterval`) and clear it at the top of `runScan()` alongside `state.retryTimer`.
- **Effort:** S (3-line fix: store, clear, clear)

**6. `done` state is a dead end -- Re-scan disabled**
- **File:** `extension/popup.js` lines 825-832
- **Fix:** After successful completion, `scanBtn.disabled` remains `true` (set at line 775, never re-enabled in the done branch). Testers who need to complete multiple courses must close and reopen the popup. Add `$('scanBtn').disabled = false;` after `setPhase('done')` at approximately line 830.
- **Effort:** S (one line)

**7. Save model contradiction in options page**
- **File:** `extension/options.js` lines 139-144
- **Fix:** All inputs fire `saveSettings()` on `change` events (auto-save), but an explicit Save button also exists. Users who do not click Save may not realize their settings are already persisted; users who navigate away "without saving" may not realize they already did. Pick one model: either remove the Save button and add subtle per-field confirmation (a brief flash on the changed field), or remove the auto-save `change` listeners and rely entirely on the explicit Save button.
- **Effort:** M (design decision + implementation)

**8. First-use experience: 10.8 seconds of silence before failure**
- **File:** `extension/popup.js` lines 625-764, `extension/popup.html` line 45
- **Fix:** When opened on a non-LMS page with `autoScan=true` (default), the user waits through 6 retry cycles (6 x 1.8s) before seeing "No SCORM API found." The retry message "Course may still be loading" is misleading when no course exists. Options: (a) reduce default retry count for first scan to 2-3 with a "Scan again?" prompt, (b) replace "Course may still be loading" with "Looking for a SCORM course on this page..." which is accurate for both LMS and non-LMS contexts, (c) add a brief explanatory line on first install.
- **Effort:** M

**9. Color token drift between popup and all other surfaces**
- **Files:** `extension/popup.css` line 8, `extension/options.css` line 6, `docs/index.html` line 10, `docs/privacy.html` line 9
- **Fix:** Popup uses `--bg: #050b12`; the other three surfaces use `#060c14`. Additionally, `--bg2`, `--surface`, `--surface3`, `--line`, `--line2` all drift by 1-2 hex steps between popup and options. Normalize popup.css to match the other three surfaces. This eliminates the visible color jump when opening settings from the popup. Also reconcile `--teal-glow` (popup, 0.18 opacity) vs `--teal-dim` (options, 0.12 opacity) -- choose one name and one value.
- **Effort:** S (update ~8 token values in popup.css)

**10. Options page has zero responsive breakpoints**
- **File:** `extension/options.css`
- **Fix:** The options page opens in a full browser tab (`open_in_tab: true`) but has zero `@media` queries. The fixed 210px sidebar leaves insufficient content space below ~580px viewport width. Add at minimum one breakpoint at ~640px that collapses the sidebar to a horizontal top nav or hides it behind a toggle. Also reduce content padding at narrow widths.
- **Effort:** M-L

**11. Landing page and privacy page header overflow at narrow viewports**
- **Files:** `docs/index.html`, `docs/privacy.html`
- **Fix:** Both headers use `display: flex; justify-content: space-between` without `flex-wrap: wrap`. The brand + three nav links overflow at ~320-360px viewport width. Add `flex-wrap: wrap; gap: 8px` to the header flex container in both files. The landing page footer already has `flex-wrap: wrap` and handles narrow widths correctly.
- **Effort:** S

**12. Text and muted colors diverge sharply between extension and docs**
- **Files:** `docs/index.html` lines 14-16, `docs/privacy.html` lines 11-13
- **Fix:** Extension `--text: #eef6ff` vs docs `--text: #ddeeff` (10% dimmer). Extension `--muted: #80a8c8` vs docs `--muted: #506878` (40% dimmer). The docs pages read as a different brand. Raise docs text values to match the extension: `--text: #eef6ff`, `--text2: #bdd8f0`, `--muted: #80a8c8`.
- **Effort:** S

### P2 -- Minor (polish, consistency, best practice)

**13. Factual error in retry interval description**
- **File:** `extension/options.html` line 148
- **Fix:** Description says "1500ms is a reasonable default" but the actual default is 1800ms (popup.js line 13). Update the description to say 1800ms.
- **Effort:** S

**14. Footer version hardcoded and stale**
- **File:** `docs/index.html` line 338
- **Fix:** Footer says "v1.0.0" while manifest.json says 1.3.0. Update to current version. Since there is no build step, consider reading it dynamically with a small inline script or simply updating it manually on each release.
- **Effort:** S

**15. Missing `icon32.png` for HiDPI toolbar**
- **Files:** `extension/icons/`, `extension/manifest.json`
- **Fix:** The toolbar icon is only declared at 16px. On 2x displays (Retina, HiDPI), Chrome scales 16px to 32px, producing a blurry result. Create a 32x32px PNG and add `"32": "icons/icon32.png"` to both `default_icon` and `icons` in manifest.json.
- **Effort:** S

**16. `word-break: break-all` too aggressive in log entries**
- **File:** `extension/popup.css` line 463
- **Fix:** `break-all` breaks SCORM field names mid-word (`cmi.core.les` / `son_status`). Replace with `overflow-wrap: break-word; word-break: normal;` which breaks only when necessary and prefers natural break points.
- **Effort:** S

**17. Quick settings scroll-wheel value divergence**
- **File:** `extension/popup.js` lines 594-611
- **Fix:** Quick settings number inputs bind only to `change` (fires on blur), not `input`. If a user scroll-wheels the score but clicks Complete without blurring, `state.settings.score` holds the old value while the input displays the new value. Add `input` event listeners that update `state.settings` immediately, or dispatch a synthetic `change` on the Complete button click.
- **Effort:** S

**18. British/American spelling inconsistency ("behaviour" vs "behavior")**
- **Files:** `extension/options.html` lines 27, 110
- **Fix:** Options page uses "Behaviour" (British). STORE_SUBMISSION.md and README use "behavior"/"behaviour" inconsistently. Choose one convention and apply it everywhere. Given `en-NZ` locale in options.js, British is likely intended -- but then update all American spellings in store/docs.
- **Effort:** S

**19. Privacy page has no mobile breakpoint**
- **File:** `docs/privacy.html`
- **Fix:** The 40px horizontal padding is excessive on mobile (10.7% of viewport per side at 375px). Add `@media (max-width: 480px) { main, header, footer { padding-left: 20px; padding-right: 20px; } }`.
- **Effort:** S

**20. Injection failure message inconsistency**
- **File:** `extension/popup.js` lines 640-641 vs 803-804
- **Fix:** Scan failure says "Script injection failed" with a 3-item cause list. Completion failure says "Injection failed" with only one suggestion. Harmonize: use the same verb phrase and add the cause list to both.
- **Effort:** S

**21. "Completion function returned no output" has no remediation**
- **File:** `extension/popup.js` line 813
- **Fix:** The message says "(unexpected)" but gives no action. Append: "Try Re-scan and complete again. If this persists, file a bug."
- **Effort:** S

**22. `--teal-ring` CSS custom property unused**
- **File:** `extension/popup.css` line 24
- **Fix:** `--teal-ring: rgba(0, 212, 168, 0.08)` is defined but never referenced anywhere. Remove it.
- **Effort:** S

**23. No `og:image` or social card meta tags on landing page**
- **File:** `docs/index.html` head section
- **Fix:** Social sharing produces no preview card. Add `<meta property="og:image" content="...">` and Twitter card meta tags. Since images are being eliminated from the store assets, consider using a simple SVG/text-based social card or skip this if social sharing is not a priority.
- **Effort:** S-M

### P3 -- Cosmetic (nice-to-have)

**24. Border radius inconsistency (7px save button vs 8px everywhere else)**
- **File:** `extension/options.css` line 143
- **Fix:** `.save-btn` uses `border-radius: 7px`. All other primary-action buttons use 8px. Change to 8px. Also add `--r: 8px; --r-sm: 4px;` tokens to options.css and use them.
- **Effort:** S

**25. `#00ffcc` hover color outside token system**
- **File:** `docs/index.html` line 90
- **Fix:** `.btn-primary:hover` uses `#00ffcc` (a brighter teal with no token). Replace with a token or a `filter: brightness(1.15)` on the existing `--teal`.
- **Effort:** S

**26. `dot-pulse` animation uses `box-shadow` (paint trigger)**
- **File:** `extension/popup.css` lines 136-139
- **Fix:** `box-shadow` is a paint-layer property. Practical impact is negligible (6x6px element, 1 instance). For correctness, replace with `transform: scale()` + `opacity` to keep the animation compositor-only.
- **Effort:** S

**27. Line-height `1.72` is an outlier**
- **File:** `extension/popup.css` line 452
- **Fix:** Every other line-height uses round values (1.5, 1.55, 1.6, 1.65, 1.7, 1.75). The log entries use 1.72. Normalize to 1.7.
- **Effort:** S

**28. Accent line height/opacity inconsistencies across surfaces**
- **Files:** `extension/popup.css` line 73 (1.5px, 0.45), `docs/index.html` (2px, 0.45), `docs/privacy.html` (2px, 0.5)
- **Fix:** Standardize to 2px height and 0.45 opacity across all surfaces.
- **Effort:** S

**29. `navigator.clipboard.writeText` no error handler**
- **File:** `extension/popup.js` line 862
- **Fix:** `.then()` with no `.catch()`. Add a `.catch()` that shows "Copy failed" feedback.
- **Effort:** S

**30. Options.js async functions missing try/catch**
- **File:** `extension/options.js` -- `loadSettings` (line 44), `saveSettings` (line 67), `renderHistory` (line 100)
- **Fix:** Wrap each in try/catch with graceful fallback.
- **Effort:** S

**31. "Reset" vs "Clear" verb mismatch for history**
- **File:** `extension/options.html` lines 210-212
- **Fix:** Info heading says "Reset Completion History"; button says "Clear History". Standardize on "Clear".
- **Effort:** S

**32. `--mono` stack missing 'Fira Code' in docs**
- **Files:** `docs/index.html` line 21, `docs/privacy.html`
- **Fix:** Extension mono stacks include 'Fira Code'; docs omit it. Add it for consistency.
- **Effort:** S

---

## Quick Wins (< 30 min each, high impact)

1. **Escape `item.title` in history rendering** (P0-1) -- one function, three call sites in `options.js`. Eliminates the XSS surface. ~10 min.

2. **Add `:focus-visible` styles** (P0-2) -- ~10 lines of CSS across popup.css and options.css. Immediately makes the extension keyboard-navigable. ~15 min.

3. **Fix ticker interval leak** (P1-5) -- store `ticker` on `state`, clear at top of `runScan()`. Three lines of JS. ~5 min.

4. **Re-enable Re-scan in done state** (P1-6) -- add `$('scanBtn').disabled = false` after `setPhase('done')`. One line. ~2 min.

5. **Normalize `--bg` and drifted tokens in popup.css** (P1-9) -- update 8 token values in popup.css `:root` to match options.css. ~10 min.

6. **Fix retry interval description** (P2-13) -- change "1500ms" to "1800ms" in options.html line 148. ~1 min.

7. **Update footer version** (P2-14) -- change "v1.0.0" to "v1.3.0" in docs/index.html line 338. ~1 min.

8. **Add `aria-live="polite"` to detection card** (P0-3) -- one attribute in popup.html. ~2 min.

9. **Add `aria-label` to icon buttons** (P0-4) -- one attribute per button in popup.html. ~2 min.

10. **Fix `word-break: break-all`** (P2-16) -- change to `overflow-wrap: break-word` in popup.css. ~1 min.

---

## Implementation Sequence

The following sequence minimizes merge conflicts by grouping changes to the same file and ordering file edits to avoid overlapping work.

### Phase 1: Security and Accessibility (P0 items)

**Batch 1A -- popup.html (all P0 HTML changes)**
- Add `role="status" aria-live="polite"` to `.detection-card` div (line 29)
- Add `aria-label` to phase-dot: `role="img" aria-label="Status: idle"` (line 14)
- Add `aria-label="Settings"` to settings icon-btn (line 19)

**Batch 1B -- popup.css (focus styles)**
- Add `:focus-visible` rules for `.icon-btn`, `.btn--ghost`, `.btn--primary`, `.copy-btn`, `.qs-input`

**Batch 1C -- popup.js (ticker fix + aria update)**
- Add `state.tickerInterval = null` to state object (line ~453)
- Clear `state.tickerInterval` at top of `runScan()` (after line 617)
- Store ticker: `state.tickerInterval = setInterval(...)` at line 723
- Update `setPhase()` to write `aria-label` on phase-dot

**Batch 1D -- options.js (XSS fix)**
- Add `esc()` function (copy from popup.js lines 578-582)
- Escape `item.title`, `item.lms`, and `domain` in `renderHistory` template (lines 121-124)
- Add try/catch to `loadSettings`, `saveSettings`, `renderHistory`

**Batch 1E -- options.css (focus styles)**
- Add `:focus-visible` rules for `.save-btn`, `.nav-item`, `.toggle-track`, `.num-input`, `.danger-btn`, radio inputs

### Phase 2: UX Fixes (P1 items)

**Batch 2A -- popup.js (state machine fixes)**
- Re-enable scanBtn in done state (add line after ~830)
- Improve first-use retry messaging (update text at line 45 in popup.html or dynamically in JS)

**Batch 2B -- popup.css (token normalization)**
- Update `:root` tokens to match options.css values (lines 8-15)
- Rename `--teal-glow` to `--teal-dim` and set opacity to 0.15 (compromise)

**Batch 2C -- options.js (save model resolution)**
- Design decision required: remove auto-save OR remove Save button
- Implementation depends on decision

**Batch 2D -- docs/index.html + docs/privacy.html**
- Normalize `--text`, `--text2`, `--muted` values to match extension
- Add `flex-wrap: wrap` to headers
- Add mobile breakpoint to privacy page
- Update footer version
- Add `'Fira Code'` to mono stack

### Phase 3: Options Page Responsive (P1-10)

**Batch 3A -- options.css (standalone -- large change)**
- Add responsive breakpoint(s)
- Sidebar collapse/horizontal nav at narrow widths
- Content padding reduction

### Phase 4: Polish (P2 and P3)

**Batch 4A -- options.html (copy fixes)**
- Fix retry interval description (1500ms to 1800ms)
- Standardize "Reset" to "Clear" for history heading
- Pick British or American spelling convention

**Batch 4B -- popup.css (cosmetic)**
- Fix `word-break: break-all` to `overflow-wrap: break-word`
- Normalize line-height 1.72 to 1.7
- Standardize accent line to 2px / 0.45 opacity
- Remove unused `--teal-ring` variable

**Batch 4C -- manifest.json + icons**
- Add icon32.png
- Update manifest to declare 32px icon

**Batch 4D -- popup.js (minor fixes)**
- Add `.catch()` to clipboard writeText
- Harmonize injection failure messages
- Add remediation text to "no output" error message
- Add `input` listener to quick settings for live validation

---

## Design System Alignment

The following unified token set should be adopted across all four surfaces. Values are chosen to match the current options.css/docs consensus (3 of 4 surfaces already agree).

### Background Scale

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#060c14` | Page/popup background |
| `--bg2` | `#09111e` | Recessed areas (tagline, quick settings) |
| `--surface` | `#0d1c2c` | Card backgrounds, header, action bar |
| `--surface2` | `#102030` | Input backgrounds, code blocks |
| `--surface3` | `#142538` | Hover states, active elements |
| `--log-bg` | `#020810` | Log panel only (popup) |

### Line Scale

| Token | Value | Usage |
|---|---|---|
| `--line` | `#1a2e42` | Primary borders |
| `--line2` | `#203a52` | Input borders, secondary dividers |
| `--line3` | `#254459` | Hover border state |

### Text Scale

| Token | Value | Usage |
|---|---|---|
| `--text` | `#eef6ff` | Primary body text |
| `--text2` | `#bdd8f0` | Secondary text, value displays |
| `--muted` | `#80a8c8` | Labels, hints, tertiary text |
| `--muted2` | `#567898` | Disabled text, timestamps |

### Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--teal` | `#00d4a8` | Brand accent, primary buttons, success-adjacent |
| `--teal-dim` | `rgba(0, 212, 168, 0.15)` | Teal background tint (unified name + opacity) |
| `--green` | `#18cc72` | Success states |
| `--green-dim` | `rgba(24, 204, 114, 0.12)` | Success background tint |
| `--amber` | `#f5a020` | Warning, retry states |
| `--amber-dim` | `rgba(245, 160, 32, 0.11)` | Warning background tint |
| `--red` | `#f04858` | Error states |
| `--red-dim` | `rgba(240, 72, 88, 0.1)` | Error background tint |
| `--blue` | `#40a8f0` | Scanning state, xAPI badge |
| `--blue-dim` | `rgba(64, 168, 240, 0.1)` | Scanning background tint |
| `--slate` | `#7aaace` | Log key labels |

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--r` | `8px` | Buttons, cards, major containers |
| `--r-sm` | `4px` | Badges, inputs, small elements |

### Typography

| Token | Value |
|---|---|
| `--font` | `-apple-system, 'Segoe UI', system-ui, sans-serif` |
| `--mono` | `'SF Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace` |

---

## Store Copy Rework

The following replaces the current store listing copy in `STORE_SUBMISSION.md`. Written to work without any screenshots, marquee images, or promotional tiles. The copy must convince on words alone.

### Chrome Web Store Listing

**Name**
```
Exeunt -- SCORM Course Completion Tool
```

**Short description** (132 chars max)
```
Force-complete SCORM 1.2 and 2004 courses in your browser. For LMS developers, QA testers, and instructional designers.
```

**Detailed description**
```
WHAT EXEUNT DOES

Open a SCORM course in your browser. Click the extension icon. Click Complete Course.

Exeunt finds the SCORM API in the page, writes the correct completion values, commits them, and closes the session. The course registers as complete in your LMS -- exactly as it would after genuine completion.

SCORM 1.2: sets lesson_status (passed or completed), score (raw, min, max), and session_time.
SCORM 2004: sets completion_status, success_status, score (raw, min, max, scaled), progress_measure, and session_time.

Both standards are auto-detected. You do not need to know which version your course uses.

WHY THIS EXISTS

If you build, test, or maintain eLearning courses, you know the drill: open the course, click through 47 slides, answer the quiz, wait for the completion to register, do it again when the next build breaks something. Exeunt eliminates the click-through. You get a clean completion record in your LMS in seconds, not minutes.

HOW IT WORKS

1. Exeunt scans all frames in the active tab for a SCORM API object (window.API for 1.2, window.API_1484_11 for 2004).
2. It checks parent frames, top frames, and common shim libraries (pipwerks, etc.).
3. If the API is not immediately available, it retries automatically -- configurable up to 10 attempts with adjustable delay -- to handle courses that initialize late.
4. Once found, it writes the data model values in the correct order (score.min and score.max before score.raw for strict LMS compliance).
5. It commits the data, retries the commit if it fails, then verifies the values were accepted before closing the session.
6. Every API call and return value is logged with human-readable SCORM error code annotations.

CONFIGURABLE

All settings are accessible from the options page:

- Score (0-100 slider)
- Session time (in minutes, auto-formatted to the correct SCORM time string)
- SCORM 1.2 status preference: "passed", "completed", or auto-detect
- Retry attempts and interval for late-loading courses
- Optional: clear suspend_data (for resetting partially-completed courses)
- Optional: verify values after writing (reads them back before session close)

A local completion history tracks the last 50 courses you have completed, stored only in your browser.

WHAT IT CANNOT DO

xAPI, cmi5, and AICC courses use server-side protocols. Completion requires authenticated communication with a Learning Record Store or LMS server endpoint. A browser extension cannot forge those credentials, and Exeunt does not try. If your course uses one of these standards, Exeunt will detect it and explain why auto-completion is not possible.

Courses with proprietary completion logic beyond SCORM (custom LMS API layers, JavaScript-based progress gates) may not respond to SCORM-level completion.

PRIVACY

Exeunt collects no data. Zero analytics. Zero tracking. No remote code. No network requests. Settings and completion history are stored locally in your browser via chrome.storage. Nothing is ever transmitted anywhere. The full source code is available at https://github.com/jesposito/exeunt.

OPEN SOURCE

MIT licensed. Read the code, fork it, file issues. https://github.com/jesposito/exeunt
```

### Firefox Add-ons (AMO) Listing

**Summary** (250 chars max):
```
Force-complete SCORM 1.2 and 2004 eLearning courses directly in the browser. Auto-detects the SCORM API, writes completion values, commits, and verifies. For LMS developers, QA testers, and instructional designers. Zero data collection.
```

**Description:** Same as Chrome detailed description above.

### Notes on the Rework

- The "ROBUST BY DESIGN" section from the original was replaced with "HOW IT WORKS" -- a numbered step-by-step that reads as a clear mental model rather than a feature bullet list. This approach works better without screenshots because the reader can visualize the sequence.
- The "CONFIGURABLE" section now names each setting explicitly rather than just listing categories. Without screenshots of the options page, the copy must describe what the user will find.
- The "WHAT IT CANNOT DO" section was renamed from "LIMITATIONS" and rewritten in first person with explanation rather than caveats. This builds credibility.
- The "PRIVACY" section is shortened and made more direct. The key phrase "zero analytics, zero tracking, no remote code, no network requests" is a hard enumeration that reads as a guarantee.
- The short description was tightened from 106 to 121 characters and now explicitly names all three target audiences.

---

## Appendix: WCAG 2.1 AA Compliance Checklist

**Scope:** Extension popup, options page, landing page, privacy page.

| Criterion | Status | Notes |
|---|---|---|
| **1.1.1 Non-text Content** | Partial | Phase dot, scan rings, retry orb have no text alternatives. Icon buttons need aria-label. Store icon (128px) has alt text via manifest. |
| **1.2.1-1.2.5 Time-based Media** | N/A | No audio or video content. |
| **1.3.1 Info and Relationships** | Fail | Popup has no semantic landmark roles. Detection card state changes are not programmatically determinable. Options page sidebar uses `<nav>` but anchor links lack `aria-current`. |
| **1.3.2 Meaningful Sequence** | Pass | DOM order matches visual order in all four surfaces. |
| **1.3.3 Sensory Characteristics** | Partial | Phase dot color changes communicate state but no non-color indicator accompanies them. The "Ready" / "Complete" badge text partially compensates. |
| **1.4.1 Use of Color** | Partial | Log entries use color (green/red/amber) as the primary differentiator for ok/error/warning. The prefix icons (check/X/triangle) provide a text alternative but they are Unicode characters in the same color, not independent of color. |
| **1.4.2 Audio Control** | N/A | No audio. |
| **1.4.3 Contrast (Minimum)** | Partial | Primary text (`--text: #eef6ff` on `--bg: #060c14`) passes at approximately 15:1. Muted text on the extension surfaces (`--muted: #80a8c8` on `--bg`) passes at approximately 5.5:1. Muted text on docs (`--muted: #506878` on `--bg: #060c14`) likely fails -- needs verification but 40% dimmer than extension muted. Tagline (`--muted` on `--bg2`) should be checked. |
| **1.4.4 Resize Text** | Partial | Popup is fixed-width (400px) -- browser text zoom is not applicable in extension popups. Options page as full tab supports browser zoom. Landing page uses `clamp()` on hero title. |
| **1.4.5 Images of Text** | Pass | No images of text in the extension UI. Store assets (being eliminated) contained text. |
| **1.4.10 Reflow** | Partial | Popup: N/A (fixed 400px). Options: fails below ~580px (no responsive layout). Landing: partially passes (one breakpoint at 600px). Privacy: no breakpoint. |
| **1.4.11 Non-text Contrast** | Partial | Interactive element borders (`--line2` on `--bg`) may not meet 3:1 ratio. Phase dot at 6x6px may be below minimum touch target guidance. |
| **2.1.1 Keyboard** | Fail | No `:focus-visible` styles on any interactive element across any surface. Tab order follows DOM (correct) but focus is invisible. |
| **2.1.2 No Keyboard Trap** | Pass | No keyboard traps detected. Tab moves linearly through popup elements. |
| **2.4.1 Bypass Blocks** | N/A | Extension popup is small enough not to need skip links. Options page sidebar could benefit from a skip-to-content link. |
| **2.4.2 Page Titled** | Pass | All four surfaces have appropriate `<title>` elements. |
| **2.4.3 Focus Order** | Pass | DOM order matches logical reading order. |
| **2.4.4 Link Purpose** | Pass | All links have clear text or context. |
| **2.4.6 Headings and Labels** | Partial | Options page uses descriptive pane titles. Popup has no headings (appropriate for its size). Landing page heading hierarchy is correct. |
| **2.4.7 Focus Visible** | Fail | No `:focus-visible` styles anywhere. This is the single highest-impact accessibility fix. |
| **3.1.1 Language of Page** | Pass | All four HTML files declare `lang="en"`. |
| **3.2.1 On Focus** | Pass | No context changes on focus. |
| **3.2.2 On Input** | Partial | Options auto-save on `change` event could be considered an unexpected context change. The Save button creates a conflicting mental model. |
| **3.3.1 Error Identification** | Pass | Error messages clearly identify what went wrong (SCORM API not found, injection failed, commit failed, etc.). |
| **3.3.2 Labels or Instructions** | Pass | All form inputs have associated labels (popup uses `<label>` wrapping; options uses label text + field description pattern). |
| **4.1.1 Parsing** | Pass | HTML is well-formed. No duplicate IDs detected. |
| **4.1.2 Name, Role, Value** | Fail | Icon buttons lack programmatic names (title only, no aria-label). Phase dot has no role or label. Detection card states lack programmatic announcement. Custom toggle in options lacks ARIA attributes. |
| **4.1.3 Status Messages** | Fail | Phase transitions, scan results, and completion outcomes are not announced via `aria-live` regions. |

---

**Document produced by Agent 3A (Findings Consolidation) from 6 parallel audit agents.**

**Key files referenced throughout:**
- `/home/jed/dev/exeunt/extension/popup.html` (117 lines)
- `/home/jed/dev/exeunt/extension/popup.css` (557 lines)
- `/home/jed/dev/exeunt/extension/popup.js` (928 lines)
- `/home/jed/dev/exeunt/extension/options.html` (290 lines)
- `/home/jed/dev/exeunt/extension/options.css` (525 lines)
- `/home/jed/dev/exeunt/extension/options.js` (151 lines)
- `/home/jed/dev/exeunt/extension/manifest.json` (29 lines)
- `/home/jed/dev/exeunt/docs/index.html` (348 lines)
- `/home/jed/dev/exeunt/docs/privacy.html` (177 lines)
- `/home/jed/dev/exeunt/STORE_SUBMISSION.md` (193 lines)
- `/home/jed/dev/exeunt/CHANGELOG.md` (92 lines)

---

# Changelog

All notable changes to Exeunt are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.5.0] - 2026-03-17

### Added
- Light theme via `prefers-color-scheme: light` across all 4 surfaces (popup, options, landing, privacy)
- Dark theme remains default; light theme activates automatically based on OS preference
- Light-specific accent colors calibrated for WCAG contrast on light backgrounds (e.g. teal #00856b vs dark's #00d4a8)

---

## [1.4.0] - 2026-03-17

### Security
- Fixed XSS vulnerability in options history rendering: `item.title`, `item.lms`,
  and `domain` are now HTML-escaped before innerHTML interpolation

### Accessibility
- Added ARIA tab pattern to options sidebar (role="tablist", role="tab",
  role="tabpanel", aria-selected) with full keyboard navigation (arrow keys)
- Added aria-live="polite" to detection card, log panel, and save status
- Added aria-label to phase dot (updates dynamically with phase name)
- Added aria-label="Settings" to icon button
- Added :focus-visible outlines on all interactive elements across popup and options
- Fixed toggle checkbox visibility: hidden inputs now use sr-only pattern with
  :focus-within on toggle-row for visible keyboard focus
- Added fieldset/legend for SCORM 1.2 radio group
- Added for/aria-labelledby associations on all options form inputs
- Added skip-to-content links on landing and privacy pages
- Added aria-label to distinguish header/footer nav landmarks on docs pages
- Added prefers-reduced-motion media query (disables all animations)

### Fixed
- Interval leak: retry countdown setInterval now stored on state and cleared
  on Re-scan click (was orphaned in closure, causing erratic display)
- Done state no longer a dead end: Re-scan button re-enabled after completion
- Save model contradiction resolved: removed auto-save change listeners,
  Save button is now the only persistence trigger
- Retry messaging improved: "Course may still be loading" replaced with
  "Looking for a SCORM course on this page..."
- Clipboard copy now has .catch() with "Copy failed" feedback
- Injection failure messages harmonized between scan and completion paths
- "No output" error now includes remediation text

### Changed
- Color tokens normalized across all 4 surfaces (popup now matches options/docs)
- --teal-glow renamed to --teal-dim (opacity 0.15) across popup and options
- Docs text colors raised to match extension (#eef6ff, #bdd8f0, #80a8c8)
- dot-pulse animation replaced with transform/opacity (was box-shadow paint trigger)
- word-break: break-all replaced with overflow-wrap: break-word in log entries
- Options sidebar collapses to horizontal nav at 640px viewport width
- Privacy page adds mobile breakpoint at 480px
- Landing/privacy headers add flex-wrap for narrow viewports
- Store listing copy rewritten to work without screenshots or images
- Footer version updated to 1.4.0 (read from manifest at runtime)
- Accent line standardized to 2px / 0.45 opacity across all surfaces
- Removed unused --teal-ring CSS variable
- Removed dead successSet variable in SCORM 2004 path
- Added icon32.png reference in manifest for HiDPI toolbar
- Retry interval description corrected (1500ms to 1800ms)
- "Reset Completion History" standardized to "Clear Completion History"
- Added Fira Code to --mono stack on docs pages
- Replaced #00ffcc hover with #00e8bc on landing page
- Save button border-radius normalized to 8px
- Added main landmark to landing page
- Added try/catch to options.js async functions
- Quick settings now sync to state.settings on input (not just change)

---

## [1.3.0] - 2026-03-17

### Fixed
- Version number in options page now reads from the manifest at runtime via
  chrome.runtime.getManifest() instead of being hardcoded. Will always match
  the release version automatically.

---

## [1.2.0] - 2026-03-17

### Changed
- README: added inline citations with links for all statistics
  - $400B global / $100B US training spend: ATD State of the Industry via eLearning Industry (2025)
  - 8% CEO ROI figure: ATD (2025)
  - 49% of workers skip compliance training: Shortlister survey via Continu
  - Forgetting curve (50/70/90%): Ebbinghaus (1885), replicated by Murre & Dros, PLOS ONE (2015)
  - $6B compliance training market / 8% CAGR: Mordor Intelligence (2025)

---

## [1.1.0] - 2026-03-17

### Fixed
- Removed all em dashes from README, extension HTML, and CSS files
- Manifesto list bullets changed from em dash to teal marker

### Improved
- Contrast lifted across popup and options dark theme: --text, --text2,
  --muted, --muted2, and --slate all significantly brighter for readability
- Manifesto blockquote lifted from muted grey to --text2 so it reads as a highlight

### Changed
- README: xAPI/cmi5 section rewritten as a genuine endorsement of the standard.
  Explains what xAPI can capture that SCORM cannot (on-the-job performance, not
  just course completion), why cmi5 is the right direction for new development,
  and the actual technical reason Exeunt cannot support them without forging
  authenticated LRS statements.

### Infrastructure
- Release workflow replaced: now triggers on every merge to main and via
  workflow_dispatch, reads version from extension/manifest.json, skips if a
  release for that version already exists, and pulls release notes automatically
  from CHANGELOG.md. No more manual tag pushes required.

---

## [1.0.0] — 2025-03-17

### Initial release

**SCORM support**
- SCORM 1.2 completion: sets `lesson_status`, `score.raw/min/max`, `session_time`, `exit`
- SCORM 2004 completion: sets `completion_status`, `success_status`, `score.raw/min/max/scaled`, `progress_measure`, `session_time`
- Auto-detects standard from `window.API` vs `window.API_1484_11`
- Detects xAPI/TinCan/cmi5 and AICC signals and explains why auto-complete isn't possible

**Robustness**
- Multi-location API search (`window`, `window.top`, `window.parent`, pipwerks shim)
- All-frames injection via `allFrames: true` and `world: 'MAIN'`
- Auto-retry loop — configurable attempts and interval
- Correct SCORM 1.2 write order (min/max before raw)
- "passed" → "completed" fallback for strict LMS implementations
- `LMSCommit()` retry on failure
- Pre-close verification (reads values back before Terminate/Finish)
- Full SCORM 1.2 and 2004 error code tables in log output

**Options**
- Score (0–100 slider)
- Session time (minutes)
- SCORM 1.2 status preference (auto / passed / completed)
- Auto-scan on popup open
- Auto-complete on detection (aggressive mode)
- Retry count and interval
- Clear suspend_data (destructive, off by default)
- Verify after completion
- Tagline visibility

**Other**
- Completion history (local, max 50 entries, never transmitted)
- Copy log button
- Manifesto tab
- Chrome MV3 compliant
- Zero dependencies, no build step

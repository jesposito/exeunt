# Changelog

All notable changes to Exeunt are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

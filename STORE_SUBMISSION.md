# Store Submission Guide

Everything needed to get Exeunt into the Chrome Web Store and Firefox Add-ons.

---

## Chrome Web Store

### Pre-flight checklist

- [ ] Google developer account registered (one-time $5 fee): https://chrome.google.com/webstore/devconsole
- [ ] 2-Step Verification enabled on the Google account
- [ ] Extension zip built correctly (manifest.json at root, not inside a subfolder)
- [ ] GitHub Pages live at https://jesposito.github.io/exeunt (enable in repo Settings → Pages → Deploy from `docs/`)
- [ ] Privacy policy accessible at https://jesposito.github.io/exeunt/privacy.html

### Build the correct zip

The CWS requires manifest.json at the **root** of the zip, not inside an `extension/` subdirectory.

```bash
cd extension/
zip -r ../exeunt-cws.zip . -x "*.DS_Store" -x "__MACOSX/*"
```

The GitHub Actions release workflow (`release.yml`) does this automatically on every version tag.

### Upload and fill out the listing

1. Go to https://chrome.google.com/webstore/devconsole
2. Click **New item** → upload `exeunt-cws.zip`
3. Fill in the **Store listing** tab:

---

#### Store listing copy

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

---

### Privacy practices tab

**Single purpose description**
```
Exeunt has one purpose: to inject SCORM completion values into the active browser tab for testing and development workflows. It detects the SCORM API in any accessible frame, writes the correct data model values, and commits the session.
```

**Permission justifications**

| Permission | Justification to enter in the dashboard |
|---|---|
| `activeTab` | Required to access the currently active tab when the user clicks the extension icon, in order to scan frames for the SCORM API and inject the completion script. |
| `scripting` | Required to inject JavaScript into the active tab's frames. The injected script reads and writes SCORM API values (window.API / window.API_1484_11) to trigger course completion. This is the core function of the extension. The world: 'MAIN' flag is required because the SCORM API exists on the page's window object, not in an isolated extension context. |
| `storage` | Required to persist user settings (score, session time, retry preferences) and a local completion history log. All data is stored locally using chrome.storage and never transmitted. |

**Remote code**
```
No. The extension executes no remote code. All JavaScript is bundled locally in the extension package.
```

**Data usage**
- Does not collect or use any user data
- Does not share any user data with third parties

---

### Assets

No screenshots, marquee tiles, or promo images are required. The listing is designed to work on copy alone.

**Icon** (128×128): `extension/icons/icon128.png`

---

### Category and visibility

- **Category**: Developer Tools
- **Language**: English
- **Visibility**: Public
- **Privacy policy URL**: `https://jesposito.github.io/exeunt/privacy.html`

---

### Review timeline

Simple developer tools with `scripting` permission typically take 3–7 business days. The `scripting` + `activeTab` combination sometimes triggers manual review. The permission justifications above are written to pre-empt reviewer questions.

If rejected, the most likely reasons are:
1. `scripting` justification not detailed enough  - expand to explain MAIN world requirement
2. Privacy policy URL not yet live  - ensure GitHub Pages is enabled before submitting
3. Store description too vague  - the detailed description above should satisfy the single-purpose requirement

---

## Firefox Add-ons (AMO)

### Account

Register at https://addons.mozilla.org/developers/  - free, no registration fee.

### Manifest compatibility

Firefox MV3 support is still maturing. The current manifest.json should work but test on Firefox 121+ before submitting. If `scripting` causes issues, Firefox accepts `browser.scripting` with the same parameters.

### Source code submission

Mozilla requires source code for review if the extension contains any minified or obfuscated JS. Exeunt is unminified vanilla JS, so the extension zip itself serves as the source. When prompted during submission, select "This add-on does not use any build tools or compilation steps."

### AMO listing differences

**Summary** (250 chars max):
```
Force-complete SCORM 1.2 and 2004 eLearning courses directly in the browser. Auto-detects the SCORM API, writes completion values, commits, and verifies. For LMS developers, QA testers, and instructional designers. Zero data collection.
```

**Description:** Same as Chrome detailed description above.

- **Categories**: Web Development
- **Privacy policy**: same URL

### Known Firefox differences

Firefox's implementation of `chrome.scripting.executeScript` with `world: 'MAIN'` behaves slightly differently in some versions. If SCORM APIs aren't detected, test by opening the browser console and running `window.API` manually to confirm the API exists in the expected context.

---

## Enabling GitHub Pages

1. Go to https://github.com/jesposito/exeunt/settings/pages
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/docs`
4. Save  - the site will be live at `https://jesposito.github.io/exeunt` within a few minutes

Verify:
- `https://jesposito.github.io/exeunt/`  - landing page
- `https://jesposito.github.io/exeunt/privacy.html`  - privacy policy (required for CWS submission)

---

## Release workflow (automated)

After the first manual CWS submission, subsequent releases can be automated:

```bash
# Bump version, commit, tag  - GitHub Actions builds and attaches the zip
git add -A
git commit -m "Release v1.1.0"
git tag v1.1.0
git push && git push --tags
```

The `release.yml` workflow creates a GitHub Release with the correctly structured zip attached. Download it from the release and upload it to the CWS dashboard for update submissions.

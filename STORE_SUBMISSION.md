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
Exeunt — SCORM Course Completion Tool
```

**Short description** (132 chars max)
```
Force-complete SCORM 1.2 and 2004 eLearning courses. For LMS developers, course testers, and QA workflows.
```

**Detailed description**
```
Exeunt detects and triggers the SCORM completion sequence in any eLearning course running in your browser. Built for developers testing LMS integrations, instructional designers iterating on course builds, and QA engineers who need to verify completion behaviour without sitting through content repeatedly.

WHAT IT DOES
Open any SCORM course, click the extension, click Complete Course. Exeunt injects the correct data model values, commits them, and closes the session — exactly as the course would do on genuine completion.

SCORM 1.2: sets cmi.core.lesson_status, score, and session_time
SCORM 2004: sets cmi.completion_status, cmi.success_status, score, progress_measure, and session_time

ROBUST BY DESIGN
→ Auto-retry loop — scans up to N times with configurable delay, handling courses that initialise their SCORM API after page load
→ Multi-location search — checks window.API, window.top.API, window.parent.API, pipwerks shim, and SCORM 2004 equivalents across all accessible frames
→ Correct write order — sets score.min and score.max before score.raw for strict LMS compliance
→ Commit retry — retries LMSCommit on failure before reporting an error
→ Pre-close verification — reads values back after writing to confirm they stuck
→ Full error annotation — every return value is annotated with human-readable SCORM error strings

CONFIGURABLE
Score, session time, SCORM 1.2 status preference (passed/completed/auto), retry attempts and interval, suspend data clearing, and post-completion verification — all accessible from the options page.

PRIVACY
Exeunt collects no data. Settings and a local completion history are stored in your browser only, never transmitted anywhere. No analytics, no tracking, no remote code, no servers.

LIMITATIONS
xAPI/cmi5 and AICC courses cannot be auto-completed (server-side protocol required). Courses with proprietary LMS-layer completion rules beyond SCORM may not respond. Cross-origin course iframes require switching DevTools context to the frame.

Open source: https://github.com/jesposito/exeunt
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

Upload from `store-assets/`:

| Asset | File | Dimensions |
|---|---|---|
| Screenshot 1 | `screenshot-1280x800.png` | 1280×800 |
| Marquee tile | `marquee-1280x800.png` | 1280×800 |
| Small promo tile | `small-promo-440x280.png` | 440×280 |

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
1. `scripting` justification not detailed enough — expand to explain MAIN world requirement
2. Privacy policy URL not yet live — ensure GitHub Pages is enabled before submitting
3. Store description too vague — the detailed description above should satisfy the single-purpose requirement

---

## Firefox Add-ons (AMO)

### Account

Register at https://addons.mozilla.org/developers/ — free, no registration fee.

### Manifest compatibility

Firefox MV3 support is still maturing. The current manifest.json should work but test on Firefox 121+ before submitting. If `scripting` causes issues, Firefox accepts `browser.scripting` with the same parameters.

### Source code submission

Mozilla requires source code for review if the extension contains any minified or obfuscated JS. Exeunt is unminified vanilla JS, so the extension zip itself serves as the source. When prompted during submission, select "This add-on does not use any build tools or compilation steps."

### AMO listing differences

- **Summary** (250 chars): same as short description above
- **Description**: same as Chrome detailed description
- **Categories**: Web Development
- **Privacy policy**: same URL

### Known Firefox differences

Firefox's implementation of `chrome.scripting.executeScript` with `world: 'MAIN'` behaves slightly differently in some versions. If SCORM APIs aren't detected, test by opening the browser console and running `window.API` manually to confirm the API exists in the expected context.

---

## Enabling GitHub Pages

1. Go to https://github.com/jesposito/exeunt/settings/pages
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/docs`
4. Save — the site will be live at `https://jesposito.github.io/exeunt` within a few minutes

Verify:
- `https://jesposito.github.io/exeunt/` — landing page
- `https://jesposito.github.io/exeunt/privacy.html` — privacy policy (required for CWS submission)

---

## Release workflow (automated)

After the first manual CWS submission, subsequent releases can be automated:

```bash
# Bump version, commit, tag — GitHub Actions builds and attaches the zip
git add -A
git commit -m "Release v1.1.0"
git tag v1.1.0
git push && git push --tags
```

The `release.yml` workflow creates a GitHub Release with the correctly structured zip attached. Download it from the release and upload it to the CWS dashboard for update submissions.

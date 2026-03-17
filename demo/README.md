# Exeunt Demo Course

A standalone demo page that provides realistic SCORM 1.2 and SCORM 2004 API stubs. Use it to test the Exeunt extension against real SCORM APIs without needing an LMS.

## How to run

```bash
# From the repo root
python3 -m http.server 8000
```

Then open: `http://localhost:8000/demo/`

## How to test with Exeunt

1. Serve the page (see above)
2. Open `http://localhost:8000/demo/` in Chrome
3. Click the Exeunt extension icon
4. Exeunt will detect the SCORM API and show the standard it found
5. Use the "Complete" button in Exeunt, then watch the live CMI state panel and API call log update in real time

## Switching between SCORM 1.2 and SCORM 2004

Use the mode toggle at the top of the page. Switching resets all state and replaces the API on `window` -- Exeunt will detect the newly active standard next time it scans.

- SCORM 1.2 uses `window.API` with `LMSInitialize`, `LMSGetValue`, etc.
- SCORM 2004 uses `window.API_1484_11` with `Initialize`, `GetValue`, etc.

Only one API is active at a time.

## Why file:// does not work

Chrome blocks content script injection on `file://` URLs by default. The page must be served over HTTP (even `localhost`) for Exeunt to read and write SCORM data.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Demo page with mode toggle, live CMI state, API log, and manual controls |
| `scorm-api.js` | SCORM 1.2 and 2004 API stubs with full state machine and error codes |
| `style.css` | Styles matching the Exeunt dark-theme design system |

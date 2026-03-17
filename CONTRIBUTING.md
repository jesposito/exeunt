# Contributing to Exeunt

Thanks for considering a contribution. Exeunt is a small, focused tool — contributions that keep it that way are most welcome.

## Bug reports

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:

- Browser and version
- LMS name and version if known
- SCORM standard (1.2 or 2004)
- The full output from the Exeunt log panel (use the **Copy** button)
- What you expected vs what happened

## Feature requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

Before opening one, check whether the request is about:
- A robustness gap (unexpected LMS behaviour, API location we don't check) — very welcome
- A new SCORM-adjacent standard — consider scope carefully
- UI preferences — consider opening a discussion first

## Pull requests

1. Fork and clone the repo
2. Make changes in the `extension/` directory — no build step required
3. Test manually against at least one SCORM 1.2 and one SCORM 2004 course
4. Open a PR with a clear description of what changed and why

### Code style

- Vanilla JS, no frameworks, no build tooling — keep it that way
- Injected functions (prefixed `_`) must be **completely self-contained** — no closure references, no imports
- All injected functions must use `world: 'MAIN'` to access the page's actual `window` object
- Log entries use the `{ t, m }` / `{ t, k, v }` shape — add new types if needed but keep the renderer in sync

### LMS signatures

If you've identified a new LMS fingerprint pattern, add it to the `lmsList` array in the `_detect()` function in `popup.js`. Pattern matching is simple `.includes()` on a lowercased concatenation of `href`, `title`, and a snippet of `innerHTML`.

## What Exeunt is not trying to be

- A full SCORM debug/inspection tool (there are better ones)
- An xAPI statement generator
- A way to bypass genuinely safety-critical competency assessments

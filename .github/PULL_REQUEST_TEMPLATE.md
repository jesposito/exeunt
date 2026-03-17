## What this changes

<!-- Describe what you changed and why -->

## Type of change

- [ ] Bug fix
- [ ] Robustness improvement (new LMS, edge case, error handling)
- [ ] New feature
- [ ] Documentation

## Testing

- [ ] Tested against SCORM 1.2
- [ ] Tested against SCORM 2004
- LMS tested against: <!-- Moodle / SCORM Cloud / etc -->
- Browser(s) tested: 

## Checklist

- [ ] Injected functions (`_detect`, `_completeSCORM12`, `_completeSCORM2004`) are fully self-contained with no closure references
- [ ] No new dependencies introduced
- [ ] No build step required
- [ ] CHANGELOG.md updated if this is a user-visible change

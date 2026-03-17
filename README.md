<div align="center">

# Exeunt

**The compliance theatre performance is over.**

*All the world's a stage, and most of what passes for workplace learning is merely players, strutting and fretting their hour upon the screen, full of sound and fury, signifying nothing.*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-blue.svg)](extension/manifest.json)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)

</div>

---

## What Exeunt Does

Exeunt is a browser extension that force-completes SCORM 1.2 and SCORM 2004 eLearning courses. Open a course, click the extension, hit Complete Course. Done.

It is built for developers testing LMS integrations, L&D professionals who need to iterate on courses without sitting through 45 minutes of content per test run, and learners who demonstrably hold the knowledge being assessed and see no reason to pretend otherwise.

**[Download the latest release](https://github.com/jesposito/exeunt/releases/latest)** and load it unpacked in Chrome, Edge, or Brave.

---

## A Few Numbers Worth Sitting With

The global corporate learning industry spends over **$400 billion every year** on training. In the United States alone, that figure cracked $100 billion in a single year. By any measure, this is one of the largest sustained investments in human development in history.

And yet: only **8% of CEOs report seeing meaningful ROI** from their organisation's learning and development spend.

Forty-nine percent of workers, nearly half of every workforce surveyed, admit to skipping or not fully engaging with mandatory compliance training. They click through it. They open it in a background tab. They let it run while they answer email. Who could blame them.

Here is the research finding that should end the conversation but somehow never does: Hermann Ebbinghaus established in the 1880s, and modern neuroscience has confirmed repeatedly since, that without reinforcement humans forget roughly **50% of new information within an hour**, 70% within 24 hours, and up to **90% within a week**. This is not a theory. It is among the most replicated findings in all of cognitive psychology.

The compliance eLearning industry's response to the forgetting curve has largely been to build more courses. Longer courses. Mandatory annual re-completions of content that has not changed. More slides. More locked "Next" buttons. More knowledge checks that punish wrong answers rather than teach through them.

A $6 billion industry growing at nearly 8% annually, built on a delivery mechanism that the science says does not work, measuring success by the one metric guaranteed to mean nothing: whether the learner clicked to the final slide.

This is compliance theatre. And we are here to ring down the curtain.

---

## The Distinction That Changes Everything

There is a real argument for compliance training. Some of it. In certain contexts, documented evidence that employees have been informed of a regulation, a safety procedure, or a legal obligation has genuine value. Auditors require it. Regulators accept it as evidence of due diligence. In high-stakes domains, surgical technique, operating heavy machinery, handling hazardous materials, demonstrated competence is not bureaucratic overhead. It is the whole point.

This argument is routinely stretched far beyond its legitimate domain.

It is stretched to cover the annual cybersecurity awareness module that every employee completes regardless of whether they work in IT, finance, or the post room. It is stretched to cover the twelve-slide "Our Company Values" induction that a fifteen-year veteran is required to complete because the LMS calendar rolled over. It is stretched to cover diversity and inclusion training so thoroughly divorced from behaviour change research that its primary effect is to make organisations feel they have done something, while the evidence on mandatory unconscious bias training suggests the opposite.

The problem is not that compliance training exists. The problem is that **compliance record-keeping has been conflated with learning**, and the mechanisms built to satisfy the former have been colonised to perform the latter.

An LMS is an excellent audit trail. It is a poor learning environment. It was designed to record completion, not to produce capability. The SCORM standard was written in 2001, when the primary question was "did the learner finish?" not "can the learner perform?" These are different questions. They require different answers. We have spent two decades and hundreds of billions of dollars pretending they are the same question.

---

## What Learning Actually Is

Learning is the durable change in capability that results from experience. It is not the presentation of information. It is not the passage of time in front of a screen. It is not a certificate. It is not a completion record in a database.

The cognitive science on this has been consistent for decades. Information sticks when it is:

- **Relevant** to something the learner already knows and cares about
- **Applied** in context, not absorbed in isolation
- **Spaced** across time rather than front-loaded into a single event
- **Emotionally encoded**, connected to something that matters
- **Retrieved actively**, not passively consumed

A forty-seven-slide SCORM module with locked navigation, mandatory minimum time-on-slide, a five-question knowledge check at the end, and an annual re-completion reminder satisfies none of these criteria. It was not designed to. It was designed to generate a completion record.

The tragedy is not that organisations create bad eLearning. The tragedy is that genuinely good learning, behaviourally grounded, performance-focused, human-centred, exists and is being built by talented people every day, and it shares a delivery mechanism and a completion metric with content that has no business being called learning at all. The LMS cannot tell them apart. The completion record looks identical.

---

## A Note on xAPI and cmi5

You will notice that Exeunt does not support xAPI, TinCan, or cmi5 courses. This is worth explaining, because the reason is not a technical limitation to work around. It is a deliberate acknowledgement that these standards represent a genuinely better approach.

SCORM records one thing: did this person complete this course in this LMS. xAPI was designed from the ground up to answer a different and far more useful question: what is this person actually doing, and what effect is it having?

An xAPI statement can capture performance on the job, not just in a course. It can record that a nurse applied a clinical skill correctly, that a sales rep used a new technique on a real call, that a technician completed a physical task in the correct sequence. Statements travel to a Learning Record Store that exists outside any single LMS, enabling an organisation to build a genuine picture of capability development over time rather than a list of completions.

cmi5 extends this further, bringing LMS-style launch and registration together with xAPI's richer data model, giving organisations the tracking discipline of SCORM with the expressive power of xAPI.

These are not perfect standards. Their adoption has been uneven and their tooling is still maturing. But the direction of travel is right. If you are building new learning experiences, xAPI and cmi5 are the answer to the measurement problem that SCORM was never designed to solve.

Exeunt cannot complete xAPI and cmi5 courses because doing so would require forging authenticated statements to a Learning Record Store, which is a fundamentally different operation from writing values to a local JavaScript API. It is not something a browser extension can or should do. Use your LRS admin tools if you need to manipulate records for testing purposes.

---

## Who This Is For

**L&D professionals and course developers** who need to test a SCORM implementation without navigating an entire course sixty times during build. Every QA cycle in LMS development involves completing courses repeatedly. Exeunt gives you that time back.

**Learning designers** building rapid iterations who need to verify that a commit sequence fires correctly, that the LMS records the right status, that edge cases in SCORM 2004's four editions handle correctly across different platform implementations, without sitting through content you wrote yourself.

**Platform administrators** verifying LMS configuration, testing completion rules, checking that mastery scores are being interpreted correctly by their particular flavour of Moodle or Cornerstone or SuccessFactors.

**Learners** who already hold the knowledge, whose competence is not in question, and who are being asked to prove it by clicking through slides. You know who you are. You have been doing this job for eleven years and the module is about something you could teach. This tool is for you too.

---

## What This Is Not

Exeunt is not a bypass for training where demonstrated competence genuinely matters. If a course exists because someone needs to actually learn something that affects safety, not to generate a record, but to develop real capability, then the course should be completed. Most working professionals navigate this distinction every day without difficulty.

It is also not a magic bullet. An LMS that validates completion through server-side time-tracking, video progress, or proprietary activity scoring rather than SCORM status fields will not be fooled. Exeunt speaks SCORM. If your LMS has decided not to listen to SCORM, that is a different conversation.

---

## Technical Summary

Exeunt injects the correct SCORM data model values into the active tab, triggering the LMS completion sequence.

| Standard | API | Values set |
|---|---|---|
| SCORM 1.2 | `window.API` | `lesson_status`, `score.raw/min/max`, `session_time` |
| SCORM 2004 | `window.API_1484_11` | `completion_status`, `success_status`, `score.raw/min/max/scaled`, `progress_measure`, `session_time` |
| xAPI / cmi5 | n/a | Detected and identified. Not auto-completable by design. |
| AICC | n/a | Detected and identified. Server-side HACP protocol. |

**Robustness features:** auto-retry loop with configurable attempts and interval, multi-location API search across `window`/`window.top`/`window.parent`/pipwerks shim, all-frames injection via Chrome's `allFrames: true` with `world: 'MAIN'`, correct write order for strict LMS implementations, commit retry on failure, pre-close verification, full SCORM error code annotation in the log.

**Zero dependencies. No build step. Vanilla JS.**

---

## Install

### Chrome, Edge, Brave

1. [Download the latest release](https://github.com/jesposito/exeunt/releases/latest) and unzip
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. **Load unpacked** and select the `extension/` folder

### Firefox

Firefox AMO submission in progress. For now, use temporary installation via `about:debugging#/runtime/this-firefox`.

---

## Configuration

Click the **Settings icon** in the popup header to open the options page.

| Setting | Default | Notes |
|---|---|---|
| Score | 100 | Written to `score.raw` and `score.scaled` |
| Session time | 5 min | Formatted correctly per standard |
| SCORM 1.2 status | Auto | Tries "passed", falls back to "completed" |
| Auto-scan on open | On | Scans immediately when popup opens |
| Auto-complete | Off | Fires completion immediately on API detection |
| Retry attempts | 6 | How many scans before giving up |
| Retry interval | 1800ms | Delay between scans |
| Clear suspend_data | Off | Destructive: clears saved progress and quiz state |
| Verify after | On | Reads values back before closing the session |

---

## Known Limitations

**Cross-origin frames:** if the course iframe is hosted on a different domain from the LMS shell, Chrome's same-origin policy blocks script injection. Workaround: open DevTools, switch the console context to the course iframe using the frame selector dropdown, and the extension will find the API there.

**xAPI / cmi5:** not supported by design. See the section above.

**Proprietary tracking:** some LMSes layer additional completion logic on top of SCORM, time-on-page detection, video completion checks, minimum interaction counts. Exeunt satisfies the SCORM layer but cannot override platform-level rules.

---

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Areas where help is especially useful: Firefox MV3 compatibility, additional LMS fingerprint signatures, edge cases in specific authoring tool outputs (Storyline, Rise, Lectora, iSpring).

---

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">
<sub>Built for the L&D professionals, developers, and learners who know the difference between a completion record and an education.</sub>
</div>

# Student-site source snapshot

This folder contains the full public-facing `index.html` and `styles.css` structure used by the student site, after a security-focused cleanup.

## What was removed

- Production runtime script tags and client/configuration wiring.
- Inline feedback-submission runtime, including its API call and bearer-token handoff.
- Admin console files, PHP endpoints, database code, deployment settings, and private data.

The visible HTML and complete stylesheet are kept so readers can study the layout, components, themes, responsive behavior, and footer animation. The files are intentionally not deployable on their own because the private/runtime integration layer is absent.

The administrator console is not included in this public student-site snapshot.

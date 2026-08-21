# Sanitized source code

These are standalone educational examples extracted from the public behavior of SIRIUS. They contain pure functions for ordering, grouping, duplicate filtering, source filtering, and aggregate bookmark presentation.

## Included

- `adaptive-ordering.js` — interpretable difficulty signals, deterministic seeded ordering, reported-block deferral, and block scoring.
- `quiz-ordering.js` — stimulus grouping, stable intra-block order, ordinary block shuffle, and weighted block shuffle.
- `duplicate-filter.js` — deterministic one-survivor selection for explicitly tagged duplicate groups.
- `source-filter.js` — source checklist matching and stable session-key segments.
- `community-bookmarks.js` — aggregate bookmark options and stable ranked rows.

The examples have no network calls, API URLs, database clients, HTML templates, user records, credentials, password hashes, private keys, deployment settings, admin recovery code, named exceptions, or private allowlists. The deterministic seed helper is not cryptography and must never be used for passwords, sessions, tokens, or any security decision.

Production `app.js`, `index.html`, `styles.css`, PHP endpoints, service-worker configuration, SQL migrations, private configuration, and test fixtures are intentionally not copied here. The source folder is a teaching surface, not a deployable application.

# Sanitized source code

These are standalone educational examples extracted from the public behavior of SIRIUS. They contain selected HTML/CSS structure and pure functions for ordering, grouping, duplicate filtering, source filtering, and aggregate bookmark presentation.

> This folder contains only a selected part of the SIRIUS platform code; it is not the complete application. The published material is limited to sanitized structure, styling, and standalone educational functions. Production integrations, private data paths, internal APIs, credentials, and security-sensitive logic are intentionally omitted to preserve platform and student confidentiality.

> هذه الملفات جزء محدود من كود منصة SIRIUS وليست الكود الكامل للمنصة. تم نشر الهيكل والتنسيق وبعض الدوال التعليمية فقط، مع استبعاد تكاملات الإنتاج ومسارات البيانات الخاصة وواجهات النظام الداخلية والمفاتيح والمنطق الحساس أمنيًا حفاظًا على سرية المنصة والطلاب.

## Included

- `adaptive-ordering.js` — interpretable difficulty signals, deterministic seeded ordering, reported-block deferral, and block scoring.
- `quiz-ordering.js` — stimulus grouping, stable intra-block order, ordinary block shuffle, and weighted block shuffle.
- `duplicate-filter.js` — deterministic one-survivor selection for explicitly tagged duplicate groups.
- `source-filter.js` — source checklist matching and stable session-key segments.
- `community-bookmarks.js` — aggregate bookmark options and stable ranked rows.
- `question-engagement.js` — aggregate bookmark/report counters keyed by question id.
- `question-timing.js` — active visible-time state with pause, resume, finish, and normalization.
- `question-score.js` — explainable difficulty and selection signals from errors, time, changes, choices, bookmarks, and reports.
- `question-presentation.js` — filter-first display preparation, stimulus grouping, stable ordering, and reported-block deferral.
- `media-performance.js` — responsive image variants, compression profiles, preload planning, and cache policy decisions.
- `resource-budget.js` — deduplicated ids, bounded request waves, incremental render batches, cache freshness, and request coalescing.
- `large-bank-session.js` — stable question-bank indexing, bounded session windows, id-keyed answer state, bookmark tombstones, and same-session merging.
- `footer-shell.html` — sanitized semantic footer structure with public navigation labels only.
- `footer-theme.css` — sanitized theme tokens, progressive footer gradient, and reveal motion.
- `Student site/` — full public-facing `index.html` and `styles.css` snapshots after removing production runtime and network wiring.

The examples have no network calls, API URLs, database clients, private application templates, user records, credentials, password hashes, private keys, deployment settings, admin recovery code, named exceptions, or private allowlists. The deterministic seed helper is not cryptography and must never be used for passwords, sessions, tokens, or any security decision.

Production `app.js`, `admin.html`, `admin.js`, PHP endpoints, service-worker configuration, SQL migrations, private configuration, and test fixtures are intentionally not copied here. The files under `Student site/` are full public-facing HTML/CSS snapshots with the production runtime and network wiring removed; they are not deployable application files. The source folder is a teaching surface, not a deployable application.

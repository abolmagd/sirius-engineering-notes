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
- `footer-shell.html` — sanitized semantic footer structure with public navigation labels only.
- `footer-theme.css` — sanitized theme tokens, progressive footer gradient, and reveal motion.

The examples have no network calls, API URLs, database clients, private application templates, user records, credentials, password hashes, private keys, deployment settings, admin recovery code, named exceptions, or private allowlists. The deterministic seed helper is not cryptography and must never be used for passwords, sessions, tokens, or any security decision.

Production `app.js`, the complete `index.html`, the complete `styles.css`, PHP endpoints, service-worker configuration, SQL migrations, private configuration, and test fixtures are intentionally not copied here. The HTML and CSS files in this folder are sanitized excerpts, not the full platform files. The source folder is a teaching surface, not a deployable application.

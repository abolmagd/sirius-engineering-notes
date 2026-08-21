# Sanitized database design examples

This folder contains publication-safe, logical database examples for learning. The names, fields, indexes, and relationships are illustrative boundaries derived from the platform behavior; they are not a copy of the production schema.

The examples intentionally exclude identity tables, password data, private content, account records, deployment details, credentials, and executable database migrations. The JavaScript files return metadata or query-shaped plans only. They do not connect to a database, interpolate SQL, or make network requests.

## Files

- [`schema-overview.md`](schema-overview.md) — English ER diagram and domain split.
- [`schema-overview-ar.md`](schema-overview-ar.md) — Arabic explanation of the same sanitized model.
- [`data-model.js`](data-model.js) — logical table catalog, fields, indexes, and relationship metadata.
- [`relationship-graph.js`](relationship-graph.js) — safe graph traversal for explaining table paths.
- [`query-plans.js`](query-plans.js) — bounded, parameter-shaped read plans for content pages, study sessions, and aggregate views.

## Public boundary

The model separates stable question content from high-churn study state and from pre-aggregated public views. That separation is useful for performance and isolation, but it must not be treated as a production security design by itself. Real authorization, account binding, validation, transaction handling, and database policies belong on the server and are intentionally absent here.

## النسخة العربية

هذه الملفات أمثلة تعليمية منقاة لتصميم منطقي لقاعدة البيانات. الأسماء والحقول والعلاقات توضيحية وليست نسخة من schema الإنتاج. تم استبعاد جداول الهوية وبيانات كلمات السر والمحتوى الخاص وبيانات الحسابات وإعدادات النشر والمفاتيح وملفات migrations القابلة للتنفيذ.

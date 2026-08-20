# SIRIUS engineering notes

> ملخص عربي: هذه مكتبة تعليمية تشرح قرارات التصميم والخوارزميات وراء منصة SIRIUS من دون نشر كود التشغيل أو بيانات المستخدمين.

SIRIUS is a medical-question practice platform. These notes explain how its learning, review, social, export, and reliability features are designed. They are written for students and developers who want to understand the engineering trade-offs without receiving a copy of the production system.

## Start here

- [Architecture and data flow](docs/architecture-and-data-flow.md)
- [Question selection and ordering](docs/question-selection-and-ordering.md)
- [Duplicate-question filtering](docs/duplicate-question-filter.md)
- [PDF study-sheet export](docs/pdf-export.md)
- [Bookmarks and review queues](docs/bookmarks-and-review-queues.md)
- [Friends and live challenges](docs/friends-and-live-challenges.md)
- [Leaderboard and alias privacy](docs/leaderboard-and-alias-privacy.md)
- [Statistics and adaptive learning](docs/statistics-and-adaptive-learning.md)
- [Exam plans and progress](docs/exam-plans-and-progress.md)
- [Offline use, synchronization, and concurrency](docs/offline-sync-and-concurrency.md)
- [Authentication and account recovery](docs/authentication-and-account-recovery.md)
- [Question-bank and content pipeline](docs/question-bank-and-content-pipeline.md)
- [Source-grounded AI explanations](docs/ai-explanations.md)
- [Personalization and accessibility](docs/personalization-and-accessibility.md)
- [Moderation, feedback, and auditing](docs/moderation-feedback-and-auditing.md)

## Publication boundary

This repository contains documentation and sanitized pseudocode only. Production endpoints, database definitions, deployment configuration, admin recovery procedures, question-bank exports, private source documents, logs, credentials, password hashes, user records, and named account exceptions are deliberately excluded.

The documentation describes behavior, not a security contract. Exact limits and internal controls may change without being published.

# SIRIUS engineering notes

SIRIUS is a medical-question practice platform. These notes explain how its learning, review, social, export, and reliability features are designed. They are written for students and developers who want to understand the engineering trade-offs without receiving a copy of the production system.

## Start here

- [Architecture and data flow](architecture-and-data-flow.md)
- [Question selection and ordering](question-selection-and-ordering.md)
- [Duplicate-question filtering](duplicate-question-filter.md)
- [PDF study-sheet export](pdf-export.md)
- [Bookmarks and review queues](bookmarks-and-review-queues.md)
- [Friends and live challenges](friends-and-live-challenges.md)
- [Leaderboard and alias privacy](leaderboard-and-alias-privacy.md)
- [Statistics and adaptive learning](statistics-and-adaptive-learning.md)
- [Exam plans and progress](exam-plans-and-progress.md)
- [Offline use, synchronization, and concurrency](offline-sync-and-concurrency.md)
- [Authentication and account recovery](authentication-and-account-recovery.md)
- [Question-bank and content pipeline](question-bank-and-content-pipeline.md)
- [Source-grounded AI explanations](ai-explanations.md)
- [Personalization and accessibility](personalization-and-accessibility.md)
- [Moderation, feedback, and auditing](moderation-feedback-and-auditing.md)

The Arabic companion set is in `../Arabic/`. The sanitized, standalone educational source examples are in `../Source code/`.

## Publication boundary

This repository contains documentation and sanitized pseudocode only. Production endpoints, database definitions, deployment configuration, admin recovery procedures, question-bank exports, private source documents, logs, credentials, password hashes, user records, and named account exceptions are deliberately excluded.

The documentation describes behavior, not a security contract. Exact limits and internal controls may change without being published.

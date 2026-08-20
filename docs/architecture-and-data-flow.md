# Architecture and data flow

> ملخص عربي: المنصة تفصل واجهة الطالب عن الخادم، وتخزن التقدم محليًا أولًا ثم تزامنه مع الخادم مع حماية من تعارض الأجهزة.

## System shape

SIRIUS uses a browser application for the interactive study experience and a same-origin server API for identity, authorization, persistence, shared statistics, and administrative work. Static assets can be cached aggressively; user data and answer keys are never embedded in public HTML.

The browser maintains three useful layers of state:

1. **Ephemeral view state** — the open page, current question, dialog state, and animation state.
2. **Device recovery state** — the active session draft, recent answers, bookmark choices, and preferences needed to recover from refreshes or temporary network loss.
3. **Server-authoritative state** — account identity, access scope, saved study history, shared social state, and content managed by authorized operators.

The design is local-first for responsiveness, but not local-only. A student's tap updates the screen and a compact recovery record immediately. Cloud synchronization follows in a bounded queue. This prevents a slow request from making an answer feel delayed while still preserving cross-device continuity.

## Typical answer flow

```text
student chooses an option
  -> validate that the session has an answer key
  -> update the visible card
  -> write a compact recovery draft
  -> update attempts, correctness, time, and daily progress locally
  -> enqueue a cloud synchronization
  -> update shared aggregates asynchronously
```

The answer key is loaded for the selected session before practice begins. If it cannot be loaded, the session does not start. This fail-closed behavior avoids recording answers that cannot be graded consistently.

## Scope and authorization

Question access is derived from the student's academic year and active rotation or group. The browser uses that scope to present choices, but the server repeats authorization checks. Hiding a control in the interface is never treated as permission.

Shared features return purpose-built projections rather than complete account rows. A leaderboard needs an alias, avatar, rank, and aggregate performance; it does not need an email address or password metadata.

## Reliability principles

- Use deterministic identifiers and ordering where a refresh must reproduce the same session.
- Keep grouped clinical cases intact as one block.
- Save a small emergency draft before a larger payload.
- Bound network waits and provide retryable states.
- Use optimistic concurrency instead of last-write-wins overwrites.
- Cache static assets separately from user-specific data.
- Keep production configuration outside the deployed Git tree.

## What is intentionally not public

These notes do not publish production route inventories, database table definitions, infrastructure credentials, abuse thresholds, question-bank exports, or admin-only recovery workflows. That separation allows the educational design to be open while the operational attack surface remains private.

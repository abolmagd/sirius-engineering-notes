# Statistics and adaptive learning

## Counting model

Each saved answer maintains separate counters for total attempts, correct attempts, and accumulated time. A legacy answer with no explicit counters is interpreted as one attempt so an upgrade never makes a student's history appear to shrink.

Changing an unlocked answer inside the same attempt reconciles correctness but does not create a second attempt or add the same response time again. A genuinely new solve increments the counters.

## Topic aggregation

Statistics are built at three levels:

- module;
- subject inside a module;
- exact chapter inside a subject and module.

The composite scope prevents two chapters with the same title in different subjects from being merged accidentally. Coverage uses unique questions, while attempt totals remain attempt-based.

Displayed values include solved, remaining, wrong, accuracy, time, and activity history. Collapsible sections keep the page readable on small screens.

## Adaptive signals

Adaptive ordering uses signals that have a direct educational interpretation:

- first-attempt accuracy;
- active reading/answering time rather than wall-clock tab time;
- answer changes;
- choice-distribution ambiguity;
- reports and bookmarks;
- the student's personal weakness and recent outcome;
- content coverage and chapter variety.

Difficulty begins with an editorial prior. Observed metrics influence it only after enough data exists, and early samples are shrunk so a handful of answers cannot steer the whole system.

## Active time

Timing pauses when the question is no longer genuinely being viewed, such as when the tab loses visibility. It closes on navigation and page exit. This produces a better learning signal than measuring elapsed time from page load.

## Transparency and constraints

The selector does not optimize for endless engagement and does not use personal identity. It operates on question-level learning signals and saved outcomes. A deterministic session seed allows a selection decision to be reproduced during testing.

Tests verify aggregation math, legacy compatibility, exact topic scopes, best-outcome handling, active-time closure, deterministic ordering, difficulty inputs, and the relationship between flat totals and per-module totals.

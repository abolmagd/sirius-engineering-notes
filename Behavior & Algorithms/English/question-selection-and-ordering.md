# Question selection and ordering

## Filtering before ordering

Selection begins with the student's allowed curriculum scope. The candidate pool is then narrowed by module, subject, chapter, source, mode, and optional duplicate filtering. Ordering never reintroduces a question removed by access control or a student filter.

## Stimulus blocks

Questions that share a clinical case, image, table, or passage are represented as a block. Entries inside that block are ordered by their explicit stimulus position; missing positions sort last while ties preserve their original order.

Shuffling happens between blocks, not between individual questions. This prevents a case from being split or interleaved with unrelated material.

```text
group questions by stimulus id
  -> singleton block for every question with no stimulus
  -> stable sort inside grouped blocks
  -> order or shuffle whole blocks
  -> flatten blocks for rendering
```

## Timed exams

Timed mode allocates an exact target count across selected chapters in proportion to each chapter's available questions. It uses the largest-remainder method:

1. Calculate each chapter's ideal fractional share.
2. Assign the floor of each share without exceeding capacity.
3. Give remaining slots to the largest fractional remainders.
4. Shuffle inside each chapter, select the allocation, then mix the selected result.

This produces the requested total whenever enough questions exist and avoids overrepresenting tiny chapters.

## Adaptive ordering

The adaptive layer is interpretable rather than opaque. It estimates question difficulty from an editorial prior and, when enough observations exist, from several independent signals. It does not use a single “engagement” number and it does not need the student's identity.

### Signals used for each question

For every question with enough observations, the metric projection considers:

- first-attempt error rate, with early observations shrunk toward the editorial prior;
- active time spent while the question was genuinely visible, excluding hidden-tab time;
- answer changes before submission, which are a useful uncertainty signal;
- bookmark state and bookmark aggregates, used as a bounded review-need signal rather than a popularity contest;
- report presence and report count, which defer a question behind normal material while moderation is pending;
- the distribution of selected options and normalized entropy, so questions with unusually ambiguous choice patterns can be calibrated;
- the student's saved attempts, correct attempts, recent wrong outcomes, and current weak areas;
- chapter coverage and recent repetition, to keep one topic from monopolizing a session.

The projection exposes only the aggregate values needed by the selector. It does not send names, emails, passwords, or raw account rows to the ordering function.

### Difficulty score

The displayed difficulty is deliberately hidden from students but remains explainable in engineering terms. A normalized score can be represented as:

```text
observedDifficulty =
    0.55 * firstAttemptError
  + 0.17 * normalizedActiveTime
  + 0.08 * normalizedAnswerChanges
  + 0.05 * reportSignal
  + 0.15 * choiceAmbiguity

questionDifficulty =
  observations >= minimumSample
    ? observedDifficulty + personalWeaknessCorrection
    : editorialPrior + personalWeaknessCorrection
```

Each component is clamped to `[0, 1]`. Active time is normalized logarithmically so a very long case does not overwhelm the other signals. The report signal is capped, and choice entropy is shrunk until enough responses exist. A student who repeatedly answers a question incorrectly receives a small personal correction; that correction cannot rewrite the global difficulty for everyone.

Bookmarks and reports are intentionally different. A bookmark says “this is useful or needs review” and contributes a bounded review-need signal. A report says “the content may need moderation” and moves the whole stimulus block to a deferred lane. Neither signal alone is allowed to dominate question selection.

### Position score and selection

At each position, the selector computes a target difficulty from the mode, progress, ability estimate, and last outcome. Each remaining block receives a score:

```text
blockScore =
    distanceFromTarget
  - weaknessBonus
  - calibrationBonus
  + repeatedChapterPenalty
  + challengeAdjustment
  + deterministicTieBreak
```

The lowest score is selected. Training can add occasional challenge slots; normal positions prefer questions close to the target and material where the student is weak. A small calibration bonus gives under-observed items a chance to collect useful evidence. The deterministic tie-break is derived from the session seed, so restoring the same session reproduces the same order.

Reported questions are deferred behind normal material as whole blocks. They remain available for review but do not dominate a fresh session while awaiting moderation.

## Reproducibility and complexity

A seeded pseudo-random generator makes the same saved session reproducible. Weighted block shuffling uses an exponential-race key and sorting, giving approximately `O(n log n)` behavior rather than repeatedly scanning a shrinking pool.

Tests cover deterministic seeds, exact timed counts, chapter proportionality, stable ties, grouped stimuli, reported blocks, and preservation of every selected question exactly once.

## Standalone source examples

The public repository includes the corresponding pure-function examples: [`question-presentation.js`](../../Source%20code/question-presentation.js), [`question-score.js`](../../Source%20code/question-score.js), [`question-timing.js`](../../Source%20code/question-timing.js), and [`question-engagement.js`](../../Source%20code/question-engagement.js). They demonstrate the pipeline without API calls, account rows, or persistence.

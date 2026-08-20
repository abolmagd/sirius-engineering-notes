# Question selection and ordering

> ملخص عربي: اختيار الأسئلة لا يعتمد على shuffle عشوائي فقط؛ النظام يحافظ على حالات الـstimulus كمجموعة واحدة، ويوزع امتحان الوقت نسبيًا، ويرتب التدريب حسب الاحتياج والصعوبة والتنوع.

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

The adaptive layer is interpretable rather than opaque. It estimates question difficulty from a prior label and, when enough observations exist, from first-attempt accuracy, active response time, answer changes, reports, and how evenly choices attract answers. Personal history adds a small correction for weak questions.

For each position, the selector scores remaining blocks using:

- distance from the target difficulty;
- extra value for the student's weak material;
- a small calibration bonus for under-observed questions;
- a variety penalty for repeating the same chapter;
- occasional challenge slots during chapter practice;
- a deterministic tie-break derived from the session seed.

Reported questions are deferred behind normal material as whole blocks. They remain available for review but do not dominate a fresh session while awaiting moderation.

## Reproducibility and complexity

A seeded pseudo-random generator makes the same saved session reproducible. Weighted block shuffling uses an exponential-race key and sorting, giving approximately `O(n log n)` behavior rather than repeatedly scanning a shrinking pool.

Tests cover deterministic seeds, exact timed counts, chapter proportionality, stable ties, grouped stimuli, reported blocks, and preservation of every selected question exactly once.

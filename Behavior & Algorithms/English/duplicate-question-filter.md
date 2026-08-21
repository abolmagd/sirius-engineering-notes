# Duplicate-question filtering

## Why manual grouping

Two medical questions can share many words while testing different facts, and two genuinely duplicate questions can use different wording. A purely text-similarity rule therefore creates unsafe false positives.

SIRIUS uses an explicit editorial `duplicate group` tag. Editors assign the same group identifier to questions that should count as alternate copies of one item. Untagged questions are never grouped with one another.

## Runtime algorithm

When the student enables duplicate filtering:

```text
survivor_by_group = empty map

for each candidate question:
  if it has no duplicate group:
    continue
  keep the lexicographically smallest stable question id for that group

return every untagged question
       plus only the chosen survivor from each tagged group
```

The survivor rule is deterministic. The same filtered bank produces the same retained question across refreshes and devices, which matters for session restoration and analytics.

The algorithm is linear in the number of candidate questions: one pass builds the survivor map and one pass filters the list. Memory use grows with the number of duplicate groups, not the size of the whole bank.

## Placement in the pipeline

Deduplication runs after curriculum and user filters, so only duplicates inside the student's current candidate pool compete. A group with one visible member passes through normally. The result then enters stimulus grouping and question ordering.

Duplicate groups and stimulus groups solve different problems:

- A **duplicate group** says “show at most one of these alternatives.”
- A **stimulus group** says “keep all of these related questions together.”

## Safety and testing

The feature never deletes database rows and never changes saved answers. It affects only the candidate list for the new session. Tests verify that untagged items survive, one deterministic member remains per tag, filtering is stable, and mixed tagged/untagged input preserves valid questions.

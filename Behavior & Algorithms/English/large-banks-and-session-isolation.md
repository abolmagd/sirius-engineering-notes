# Large question banks and session isolation

This note explains how a question bank can grow to roughly 10,000 questions while the browser renders only the small working set that a student is using. It also explains how answer history, bookmarks, timers, and multiple tabs stay separated instead of being mixed together.

## 1. The core rule: load data in layers

The browser should not create 10,000 question cards, images, timers, and answer controls at once. A practical pipeline has four layers:

1. **Bank snapshot:** load question metadata in bounded pages. The production client uses pages of up to 1,000 rows because the data service has a response-size limit.
2. **Indexes:** keep stable question ids and small lookup indexes for modules, years, chapters, and sources. The index makes filtering predictable without depending on an array position.
3. **Session window:** after the student chooses filters, keep only the current study window in memory. A normal window is capped around 80 questions; the next window can be prepared when needed.
4. **Incremental rendering:** add the visible cards in small batches, currently modeled as batches of 15. Images and heavy stimulus blocks are hydrated only when they are relevant.

With this arrangement, a 10,000-question bank is a storage and indexing problem, not a 10,000-element DOM problem. The memory plan is approximately:

```text
bank metadata:       bounded pages / compact index
active session:      up to 80 question records
DOM work:            batches of 15 cards
images:              current image + a small look-ahead set
answer key:          only ids needed by the active session
```

`large-bank-session.js` contains a standalone model for this boundary: `indexQuestionBank`, `pageQuestionIds`, and `sessionMemoryPlan` are deliberately free of network calls and persistence.

## 2. Stable ids are the isolation boundary

Every question must be addressed by its stable `question.id`, never by its position in a page or array. Positions change when filters, duplicates, or content updates change. Stable ids allow the following records to remain attached to the correct question:

- the selected answer and attempt counters;
- active time and timing events;
- bookmark add/remove operations;
- reports and other engagement aggregates;
- the question’s image or shared stimulus group.

When a question is removed from a later snapshot, a resumed session skips it and reports that it is unavailable. It must not silently attach the old answer to the next question in the list.

## 3. A compound key separates sessions

The saved study key is derived from the study context, not from a list position. In the production behavior it includes the mode, year, modules, subject, chapters, selected sources, duplicate policy, and timed-question count. A deterministic seed may be included when a shuffled session needs to resume its exact order.

Conceptually:

```text
sessionKey = stableEncode(
  mode + filters + duplicatePolicy + timedCount + orderingSeed
)
```

The key means that a 20-question timed session and a 20-question practice session do not share answers simply because they contain some of the same question ids. A challenge or peer activity has a separate context and must not write into the student’s private study draft.

The browser keeps the active draft per tab/session boundary. Saved sessions are nested under their own key. A private storage boundary also binds the draft to the signed-in account in the application; the public example intentionally does not implement identity or storage.

## 4. Images, WebP, and fast responses

Image handling follows the same bounded-window idea as question loading. The question record keeps a lightweight reference; shared case images are deduplicated by stimulus id; and the browser loads the current image plus a small look-ahead set instead of downloading every image in the bank.

The image pipeline is:

1. validate the remote reference, allowed scheme/host, MIME type, dimensions, and byte limit;
2. downscale oversized raster images to a bounded maximum dimension;
3. compress the optimized upload as WebP when the format and memory budget are safe;
4. keep a verified original only as a safe fallback for unsupported or unsafe conversions;
5. reserve layout space, decode asynchronously, and lazy-load images farther down the page;
6. serve repeated same-origin images from a bounded versioned cache.

This keeps responses fast because the first view receives small thumbnails/variants, only the active session is hydrated, and requests are deduplicated and sent in bounded waves. Static assets, normal image browsing, and explicit offline image downloads use separate cache policies so a large offline package cannot evict the application shell. PDF export loads unique images in small waves and releases temporary object URLs after export.

The complete explanation is in [Media, performance, and caching](media-performance-and-caching.md), and the sanitized planning helpers are [media-performance.js](../../Source%20code/media-performance.js) and [resource-budget.js](../../Source%20code/resource-budget.js).

## 5. Short version of the question-ordering algorithm

Question ordering is filter-first and block-aware:

1. apply the student’s year, module, subject, chapter, source, mode, and duplicate filters;
2. keep shared cases, images, tables, or passages together as stimulus blocks;
3. order questions inside each block, then shuffle/order complete blocks with a stable session seed;
4. for timed exams, distribute the requested count across chapters proportionally using largest remainders;
5. score remaining questions using difficulty, first-attempt errors, active time, answer changes, bookmarks, reports, option-distribution ambiguity, weak areas, repetition, and chapter coverage;
6. choose the question closest to the current target, defer reported blocks, and use a deterministic tie-break so a resumed session keeps its order.

This is a concise overview only. See the [full question-selection and ordering explanation](question-selection-and-ordering.md) for the scoring model, formulas, stimulus blocks, timed allocation, and complexity.

## 6. Answer updates are idempotent and local to one session

An answer update targets exactly one question id in exactly one session:

```text
answers[sessionKey][questionId] = {
  attempts,
  correctAttempts,
  activeMs,
  lastAnswer,
  updatedAt
}
```

The application queues study writes and merges them with version-aware logic. A retry should update the same logical record rather than append a second copy. If two tabs write the same session, the merge uses the session key and record timestamps/version metadata; records from a different key are rejected. This prevents a stale tab from turning one session’s answer history into another session’s history.

## 7. Bookmarks need removal tombstones

A bookmark is not safely modeled as “present or absent” when offline writes and retries are possible. The example keeps the latest add and latest removal timestamp for each question:

```text
bookmarkAdds[questionId] = time
bookmarkRemovals[questionId] = time
active if addTime > removalTime
```

The removal timestamp is a tombstone. It prevents an older add event from bringing a deleted bookmark back after synchronization. The same question-id rule is used for community bookmark aggregates, but the public aggregate view exposes counts only; it does not publish a student’s private bookmark list.

## 8. Many sessions and nearly a quarter-million solved questions

The platform is approaching a quarter-million answered-question events according to the current project milestone. At that scale, the UI should not request or render a complete answer history on every page:

- keep the active session’s detailed records small and keyed by question id;
- store summary counters and rollups for dashboards;
- paginate history by time, scope, or session key;
- aggregate leaderboard/community views server-side before returning rows;
- use bounded pages and request coalescing for repeated reads;
- retain only the data required to resume the current session in the browser.

The milestone is an operational scale statement, not a claim that this public repository contains user records. No student names, answers, emails, or private counters are included here.

## 9. Complexity and practical limits

For `n` question metadata rows and a session window of `k` questions:

- building the basic index is `O(n)`;
- selecting a filtered page scans the relevant candidate bucket and returns at most `k` ids;
- updating one answer or bookmark is `O(1)` map work;
- rendering is `O(k)` overall and split into small DOM batches;
- image hydration is bounded by a small preload set, not by the whole bank.

The exact page size, session cap, and cache freshness values are implementation details that can change after measurement. The invariant is the important part: bounded reads, stable ids, isolated session keys, idempotent updates, and incremental rendering.

## Related source example

- [Sanitized large-bank and session-isolation model](../../Source%20code/large-bank-session.js)
- [Question selection and ordering](question-selection-and-ordering.md)
- [Offline use, synchronization, and concurrency](offline-sync-and-concurrency.md)
- [Bookmarks and review queues](bookmarks-and-review-queues.md)

# Offline use, synchronization, and concurrency

## Local-first recovery

SIRIUS writes a compact active-session draft before attempting a larger study-state write. The draft contains enough information to reconstruct selected questions, committed answers, position, and session metadata after a refresh.

Where browser storage is restricted, the application falls back from persistent storage to tab-scoped storage and then to memory. Authentication and the visible session can continue, while the interface makes it clear when cloud backup has not completed.

## Debounced synchronization

Study state can be much larger than one answer event. Uploading it after every tap would waste bandwidth and create more write races. Mutations therefore enter one queue and a debounce window combines bursts. Page exit and explicit sign-out flush pending work immediately.

## Optimistic concurrency

Each device remembers the server version it last observed. A write says, in effect, “apply this only if the server is still at that version.”

```text
attempt write(local payload, base version)
if accepted:
  store the new server version locally
if version conflict:
  fetch the winning server payload
  merge monotonic progress and explicit removals
  retry with the new base version
stop after a small bounded number of attempts
```

This avoids silent last-write-wins data loss. Merge rules preserve independent answers, history, and daily progress while respecting bookmark removals instead of treating every array as append-only.

## Offline question images

Students can download images for a selected accessible module. The offline cache is separate from the ordinary runtime image cache, so explicit offline packages are not evicted by normal browsing. Downloads are bounded, cancellable, and report progress.

## Service worker strategy

The initial install caches only assets needed for first paint. Legal pages, large icons, and optional assets warm later. Versioned JavaScript and CSS use cache-first delivery; the HTML shell and service worker revalidate so a new release can point to the correct asset versions.

Cross-origin question images bypass the service worker and use the browser's normal network path. Same-origin uploaded images use bounded caches with stable content-addressed names.

Tests simulate storage failure, stale cloud state, simultaneous device edits, equal answer counts with different questions, bookmark removal, refresh recovery, large sessions, and offline image package boundaries.

# Media, performance, and caching

This note explains how SIRIUS keeps image-heavy study sessions responsive without putting production endpoints or private storage details in the public repository.

## Image lifecycle

Images move through a deliberate pipeline:

1. The question snapshot carries lightweight image references and dimensions where available. Shared stimulus records are kept in a map keyed by `stimulusId`, so a case image is not requested once per child question.
2. The client normalizes a Drive-style reference to a thumbnail-sized source before it is displayed or migrated. Placeholder images are excluded from the real-image pipeline.
3. The storage pipeline validates the remote scheme, host, MIME type, dimensions, and byte limit before accepting a file. Remote redirects are re-checked instead of being followed blindly.
4. Migrated raster images are downscaled to a bounded maximum dimension and re-encoded as WebP when the server has enough memory. The optimizer uses a fraction of the active memory limit and falls back to the verified original when conversion is unsafe or unsupported. Animated GIFs are left untouched.
5. The browser reserves image space, decodes asynchronously, loads the current image with priority, and lazily loads images farther down the page. The quiz warms the current image plus the next few distinct image URLs; repeated stimulus URLs are deduplicated.

The public planning example is [`media-performance.js`](../../Source%20code/media-performance.js). It demonstrates variant selection, `srcset`/`sizes` properties, compression profiles, deduplicated preloading, and cache policy decisions without creating DOM nodes or making requests.

## PDF and offline images

PDF export is intentionally different from normal scrolling:

- collect unique stimulus image URLs first;
- load them in small waves rather than starting every download at once;
- use eager decoding because print layout must know image dimensions;
- create temporary object URLs only for the export;
- revoke those object URLs after success or failure.

Offline downloads are explicit. They use a separate cache from ordinary browsing, skip images already present, show progress, can be cancelled, and stop safely on quota errors. Cross-origin images are reported as not yet offline-ready rather than being silently copied through the service worker.

## Cache layers

The cache is split by volatility and ownership:

- versioned static assets use cache-first delivery;
- same-origin content-addressed images use a bounded image cache;
- explicitly downloaded offline packages use a separate cache so ordinary browsing cannot evict them;
- HTML uses a network-first path with a cached fallback so a release can update the shell;
- optional legal pages, icons, and social artwork warm after the first paint during idle time;
- cross-origin images bypass the service worker and use the browser's normal image path.

The image cache has a maximum entry count and is trimmed periodically rather than after every write. Cache names are versioned so old application shells are removed during activation. User-specific study records are not treated as static assets.

## Request and render budgets

Large tables are never loaded with one unbounded request. The client pages rows, uses a known count when available, and limits parallel page waves. Stimulus ids are deduplicated and fetched in chunks. Answer-key data is requested only for the questions that need it, and a small prefetch window warms likely next questions.

Long quiz and results views render in batches of 15. An `IntersectionObserver` sentinel requests the next batch near the viewport, and a `DocumentFragment` commits one DOM update per batch. This keeps initial layout, style calculation, and accessibility tree work bounded on phones.

[`resource-budget.js`](../../Source%20code/resource-budget.js) contains the safe planning equivalents for id deduplication, chunking, bounded concurrency, render batches, cache freshness, and request coalescing.

## Peer pages

Leaderboard and community bookmarks have independent data paths. Opening one page does not wait for or request the other page's data. A short stale-while-revalidate window makes repeated navigation instant; a force refresh follows a bookmark mutation after its own sync succeeds. An in-flight promise gate prevents duplicate refreshes, and timeouts turn a stalled ranking call into a retryable state instead of an endless spinner.

The page paints cached data synchronously and rebuilds the DOM only when a render signature changes. A partial success keeps the successful half of the peer data instead of discarding it because the other query failed.

## Practical budget rules

- Keep the first-paint asset list small.
- Send ids and aggregate projections instead of repeated full records.
- Deduplicate before chunking and cache before rendering.
- Bound concurrency; more parallel requests are not automatically faster on shared hosting.
- Do not preload an entire session when the student needs only the current question and a small look-ahead.
- Keep static caches separate from user-specific state.
- Measure image dimensions and active time instead of guessing from wall-clock load time.

// ═══════════════════════════════════════════════════════════════
// SIRIUS — Request, cache, and render budget planning
//
// Pure planning helpers for pagination, bounded concurrency, cache freshness,
// request coalescing, and incremental rendering. They do not call a server or
// write to browser storage.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ResourceBudget = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function positiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
  }

  function uniqueIds(ids) {
    return [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id ?? "").trim()).filter(Boolean))];
  }

  function chunkIds(ids, chunkSize = 100) {
    const list = uniqueIds(ids);
    const size = positiveInteger(chunkSize, 100);
    const chunks = [];
    for (let index = 0; index < list.length; index += size) chunks.push(list.slice(index, index + size));
    return chunks;
  }

  // Turn chunks into waves so a shared host never receives an unbounded burst.
  function concurrencyWaves(chunks, concurrency = 4) {
    const width = positiveInteger(concurrency, 4);
    const list = Array.isArray(chunks) ? chunks : [];
    const waves = [];
    for (let index = 0; index < list.length; index += width) waves.push(list.slice(index, index + width));
    return waves;
  }

  function renderBatches(totalItems, batchSize = 15) {
    const total = Math.max(0, Math.floor(Number(totalItems) || 0));
    const size = positiveInteger(batchSize, 15);
    const batches = [];
    for (let start = 0; start < total; start += size) batches.push({ start, end: Math.min(total, start + size) });
    return batches;
  }

  function cacheStatus(fetchedAt, now, freshnessMs = 30000) {
    const fetched = Number(fetchedAt);
    const current = Number(now);
    const freshFor = Math.max(0, Number(freshnessMs) || 30000);
    if (!Number.isFinite(fetched) || !Number.isFinite(current) || current < fetched) return "missing";
    return current - fetched < freshFor ? "fresh" : "stale";
  }

  function coalescingKey(scope, section) {
    return `${String(scope ?? "").trim()}::${String(section ?? "both").trim() || "both"}`;
  }

  return {
    uniqueIds,
    chunkIds,
    concurrencyWaves,
    renderBatches,
    cacheStatus,
    coalescingKey,
  };
});

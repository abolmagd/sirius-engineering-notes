// ═══════════════════════════════════════════════════════════════
// SIRIUS — Question-level engagement counters
//
// A small, storage-agnostic example for keeping aggregate bookmark and report
// counts keyed by question id. It accepts events or already-aggregated rows,
// but it never performs persistence or network calls.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QuestionEngagement = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function questionId(value) {
    const id = String(value ?? "").trim();
    return id || null;
  }

  function nonNegativeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }

  function emptySignal() {
    return { bookmarkCount: 0, reportCount: 0 };
  }

  function addSignal(store, idValue, type, amount = 1) {
    const id = questionId(idValue);
    if (!id || !["bookmark", "report"].includes(type)) return store;

    const next = { ...(store || {}) };
    const current = { ...emptySignal(), ...(next[id] || {}) };
    const key = type === "bookmark" ? "bookmarkCount" : "reportCount";
    current[key] = nonNegativeInteger(current[key]) + nonNegativeInteger(amount);
    next[id] = current;
    return next;
  }

  // Convert event-shaped input into a serializable { questionId: counters }
  // object. Events with no question id or an unknown type are ignored.
  function aggregateEvents(events) {
    return (Array.isArray(events) ? events : []).reduce((store, event) => {
      return addSignal(store, event?.questionId ?? event?.id, event?.type, event?.amount ?? 1);
    }, {});
  }

  // Merge two aggregate snapshots without mutating either input.
  function mergeSnapshots(left, right) {
    const next = { ...(left || {}) };
    Object.entries(right || {}).forEach(([id, value]) => {
      const current = { ...emptySignal(), ...(next[id] || {}) };
      next[id] = {
        bookmarkCount: nonNegativeInteger(current.bookmarkCount) + nonNegativeInteger(value?.bookmarkCount),
        reportCount: nonNegativeInteger(current.reportCount) + nonNegativeInteger(value?.reportCount),
      };
    });
    return next;
  }

  function signalsFor(store, idValue) {
    const id = questionId(idValue);
    const signal = id && store ? store[id] : null;
    return {
      questionId: id,
      bookmarkCount: nonNegativeInteger(signal?.bookmarkCount),
      reportCount: nonNegativeInteger(signal?.reportCount),
    };
  }

  // Attach only aggregate counters to a question object. The original object
  // is left unchanged and no student identity is introduced.
  function attachSignals(question, store) {
    const signals = signalsFor(store, question?.id);
    return { ...(question || {}), signals };
  }

  return {
    addSignal,
    aggregateEvents,
    mergeSnapshots,
    signalsFor,
    attachSignals,
  };
});

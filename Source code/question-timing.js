// ═══════════════════════════════════════════════════════════════
// SIRIUS — Active question timing
//
// The caller supplies timestamps. Pausing on hidden tabs prevents wall-clock
// time from being mistaken for time spent reading or answering a question.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QuestionTiming = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULT_MAX_ACTIVE_MS = 30 * 60 * 1000;

  function finiteTime(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clampMs(value, max = DEFAULT_MAX_ACTIVE_MS) {
    return Math.max(0, Math.min(Math.max(0, Number(max) || DEFAULT_MAX_ACTIVE_MS), finiteTime(value)));
  }

  function createTimer(questionId, startedAt = 0) {
    return {
      questionId: String(questionId ?? ""),
      startedAt: finiteTime(startedAt),
      activeMs: 0,
      pausedAt: null,
      endedAt: null,
      status: "active",
    };
  }

  function activeMsAt(timer, at, maxMs = DEFAULT_MAX_ACTIVE_MS) {
    if (!timer) return 0;
    const saved = clampMs(timer.activeMs, maxMs);
    if (timer.status !== "active") return saved;
    return clampMs(saved + Math.max(0, finiteTime(at) - finiteTime(timer.startedAt)), maxMs);
  }

  function pauseTimer(timer, pausedAt, maxMs = DEFAULT_MAX_ACTIVE_MS) {
    if (!timer || timer.status !== "active") return timer;
    const at = finiteTime(pausedAt);
    return {
      ...timer,
      activeMs: activeMsAt(timer, at, maxMs),
      pausedAt: at,
      status: "paused",
    };
  }

  function resumeTimer(timer, resumedAt) {
    if (!timer || timer.status !== "paused") return timer;
    return {
      ...timer,
      startedAt: finiteTime(resumedAt),
      pausedAt: null,
      status: "active",
    };
  }

  function finishTimer(timer, endedAt, maxMs = DEFAULT_MAX_ACTIVE_MS) {
    if (!timer || timer.status === "finished") return timer;
    const at = finiteTime(endedAt);
    return {
      ...timer,
      activeMs: activeMsAt(timer, at, maxMs),
      endedAt: at,
      pausedAt: timer.status === "active" ? at : timer.pausedAt,
      status: "finished",
    };
  }

  function normalizedTimeSignal(timer, at, maxMs = 120000) {
    const active = activeMsAt(timer, at, maxMs);
    const ceiling = Math.max(1, finiteTime(maxMs, 120000));
    return Math.max(0, Math.min(1, Math.log1p(active) / Math.log1p(ceiling)));
  }

  return {
    DEFAULT_MAX_ACTIVE_MS,
    createTimer,
    activeMsAt,
    pauseTimer,
    resumeTimer,
    finishTimer,
    normalizedTimeSignal,
  };
});

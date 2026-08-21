// ═══════════════════════════════════════════════════════════════
// SIRIUS — Explainable question score
//
// The result is an aggregate learning signal, not a public label and not a
// security decision. Bookmark and report counts are bounded so popularity or
// moderation volume cannot overwhelm accuracy and active-time evidence.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QuestionScore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const PRIORS = {
    easy: 0.25,
    basic: 0.3,
    core: 0.35,
    exam: 0.6,
    advanced: 0.75,
    hard: 0.8,
  };

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function countSignal(value, saturation) {
    const count = Math.max(0, Number(value) || 0);
    return clamp(count / Math.max(1, Number(saturation) || 1));
  }

  function priorFor(question) {
    const label = String(question?.difficulty || "").trim().toLowerCase();
    return Number.isFinite(Number(question?.difficultyScore))
      ? clamp(question.difficultyScore)
      : (PRIORS[label] ?? 0.5);
  }

  function errorSignal(metrics, prior) {
    const attempts = Math.max(0, Number(metrics?.firstAttempts ?? metrics?.attempts ?? 0));
    if (!attempts) return 1 - prior;
    const correct = Math.max(0, Number(metrics?.firstCorrect ?? metrics?.correctAttempts ?? 0));
    return clamp(1 - correct / attempts);
  }

  function timeSignal(metrics, maxActiveMs = 120000) {
    const activeMs = Math.max(0, Number(metrics?.activeMs ?? metrics?.averageActiveMs ?? 0));
    return clamp(Math.log1p(activeMs) / Math.log1p(Math.max(1, Number(maxActiveMs) || 120000)));
  }

  function answerChangeSignal(metrics) {
    const attempts = Math.max(1, Number(metrics?.firstAttempts ?? metrics?.attempts ?? 0));
    return clamp((Number(metrics?.answerChanges ?? 0) || 0) / attempts / 3);
  }

  function choiceAmbiguity(metrics) {
    const counts = metrics?.choiceCounts && typeof metrics.choiceCounts === "object"
      ? Object.values(metrics.choiceCounts).map((value) => Math.max(0, Number(value) || 0))
      : [];
    const total = counts.reduce((sum, value) => sum + value, 0);
    if (counts.length < 2 || total < 5) return 0;
    const largestShare = Math.max(...counts) / total;
    const entropy = counts.reduce((sum, count) => {
      if (!count) return sum;
      const share = count / total;
      return sum - share * Math.log(share);
    }, 0) / Math.log(counts.length);
    return clamp((entropy * 0.7 + (1 - largestShare) * 0.3) * clamp(total / 25));
  }

  function personalWeakness(metrics) {
    const attempts = Math.max(0, Number(metrics?.personalAttempts ?? 0));
    if (!attempts) return 0;
    const accuracy = clamp((Number(metrics?.personalCorrect ?? 0) || 0) / attempts);
    return clamp((0.7 - accuracy) * 0.22, -0.15, 0.15);
  }

  function scoreQuestion(question, metrics = {}) {
    const prior = priorFor(question);
    const attempts = Math.max(0, Number(metrics.firstAttempts ?? metrics.attempts ?? 0));
    const observed =
      0.55 * errorSignal(metrics, prior) +
      0.17 * timeSignal(metrics) +
      0.08 * answerChangeSignal(metrics) +
      0.05 * countSignal(metrics.reportCount ?? question?.reportCount, 5) +
      0.15 * choiceAmbiguity(metrics);
    const difficultyScore = clamp((attempts >= 3 ? observed : prior) + personalWeakness(metrics));
    const reviewNeed = countSignal(metrics.bookmarkCount ?? question?.bookmarkCount, 20);

    return {
      questionId: String(question?.id ?? ""),
      difficultyScore,
      reviewNeed,
      reportSignal: countSignal(metrics.reportCount ?? question?.reportCount, 5),
      selectionScore: clamp(difficultyScore * 0.82 + reviewNeed * 0.18),
      sampleSize: attempts,
      components: {
        error: errorSignal(metrics, prior),
        activeTime: timeSignal(metrics),
        answerChanges: answerChangeSignal(metrics),
        choiceAmbiguity: choiceAmbiguity(metrics),
      },
    };
  }

  return {
    clamp,
    choiceAmbiguity,
    scoreQuestion,
  };
});

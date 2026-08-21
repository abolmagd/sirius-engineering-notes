// ═══════════════════════════════════════════════════════════════
// SIRIUS — Adaptive question ordering
//
// Deterministic, block-aware ordering for the three student modes. The
// selector deliberately remains interpretable: it uses mastery need,
// difficulty fit, coverage, variety, and a small calibration lane instead of
// an opaque engagement model. A session seed makes the result reproducible.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AdaptiveOrdering = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DIFFICULTY_PRIORS = {
    core: 0.35,
    basic: 0.3,
    easy: 0.25,
    exam: 0.6,
    advanced: 0.75,
    hard: 0.8,
  };

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  // Deterministic non-cryptographic number used only for reproducible ordering.
  function stableSeedNumber(value) {
    let result = 2166136261;
    for (const char of String(value ?? "")) result = Math.imul(result ^ char.charCodeAt(0), 16777619) >>> 0;
    return result >>> 0;
  }

  function seededRandom(seed) {
    let value = stableSeedNumber(seed);
    return function next() {
      value = (value + 0x6d2b79f5) | 0;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function stableRank(seed, id) {
    return stableSeedNumber(`${seed}|${id}`) / 4294967296;
  }

  function normalizedMetric(metrics, question) {
    if (!metrics) return null;
    if (metrics instanceof Map) return metrics.get(question?.id) || null;
    return metrics[question?.id] || null;
  }

  function normalizedAnswer(answers, question) {
    if (!answers || !question) return null;
    if (answers instanceof Map) return answers.get(question.id) || null;
    return answers[question.id] || null;
  }

  function priorDifficulty(question) {
    const value = String(question?.difficulty || "").trim().toLowerCase();
    return DIFFICULTY_PRIORS[value] ?? 0.5;
  }

  function questionDifficulty(question, metrics, answers) {
    const global = normalizedMetric(metrics, question);
    const local = normalizedAnswer(answers, question);
    const attempts = Math.max(0, Number(global?.first_attempts ?? global?.firstAttempts ?? global?.attempts ?? 0));
    const prior = priorDifficulty(question);
    const globalAccuracy = attempts > 0
      ? (Number(global.first_correct ?? global.firstCorrect ?? 0) + 1) / (attempts + 2)
      : 1 - prior;
    const averageActiveMs = global
      ? Number(global.average_active_ms ?? global.averageActiveMs ?? 0)
        || (Number(global.total_active_ms ?? global.totalActiveMs ?? 0) / attempts)
      : 0;
    const globalTime = attempts > 0
      ? clamp(Math.log1p(averageActiveMs) / Math.log1p(120000))
      : prior;
    const globalChanges = attempts > 0
      ? clamp(Number(global.answer_changes ?? global.answerChanges ?? 0) / attempts / 3)
      : 0;
    const choiceSpread = choiceAmbiguity(question, global);
    const reported = attempts > 0 && Number(global.reported_count ?? global.reportedCount ?? 0) / attempts > 0.08 ? 0.08 : 0;
    const learnedDifficulty = clamp(
      (1 - globalAccuracy) * 0.55 + globalTime * 0.17 + globalChanges * 0.08 + reported * 0.05 + choiceSpread * 0.15
    );
    const localAttempts = Math.max(0, Number(local?.attempts || 0));
    const localAccuracy = localAttempts ? Number(local.correctAttempts || 0) / localAttempts : null;
    const personalCorrection = localAccuracy === null ? 0 : clamp((0.7 - localAccuracy) * 0.22, -0.15, 0.15);
    return clamp(attempts >= 3 ? learnedDifficulty + personalCorrection : prior + personalCorrection);
  }

  function blockHasReported(block, reportedIds) {
    const ids = reportedIds instanceof Set ? reportedIds : new Set(reportedIds || []);
    return (block || []).some((question) => ids.has(question?.id));
  }

  function choiceAmbiguity(question, metric) {
    if (!metric || !question) return 0;
    const available = ["A", "B", "C", "D", "E"]
      .filter((key) => String(question[`option${key}`] || "").trim() !== "");
    const rawCounts = metric.choiceCounts && typeof metric.choiceCounts === "object"
      ? metric.choiceCounts
      : {};
    const observed = available.length ? available : Object.keys(rawCounts).filter((key) => /^[A-E]$/.test(key));
    if (observed.length < 2) return 0;
    const counts = observed.map((key) => Math.max(0, Number(rawCounts[key] || 0)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total < 5) return 0;
    const concentration = Math.max(...counts) / total;
    let entropy = Number(metric.choiceEntropy);
    if (!Number.isFinite(entropy) || entropy < 0) {
      entropy = counts.reduce((sum, count) => {
        if (!count) return sum;
        const share = count / total;
        return sum - share * Math.log(share);
      }, 0) / Math.log(observed.length);
    }
    // Uniform answers imply disagreement; a dominant choice implies a direct
    // stem. Shrink early samples so five answers cannot oversteer a session.
    const confidence = clamp(total / 25);
    return clamp((entropy * 0.7 + (1 - concentration) * 0.3) * confidence);
  }

  function blockKey(block) {
    return (block || []).map((question) => question?.id || "").join(",");
  }

  function blockStats(block, metrics, answers) {
    const values = (block || []).map((question) => questionDifficulty(question, metrics, answers));
    const difficulty = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0.5;
    const localWrong = (block || []).reduce((sum, question) => {
      const answer = normalizedAnswer(answers, question);
      return sum + (answer && Number(answer.attempts || 0) > Number(answer.correctAttempts || 0) ? 1 : 0);
    }, 0);
    return {
      difficulty,
      weak: localWrong / Math.max(1, (block || []).length),
      chapter: block?.[0]?.chapter || "",
      stimulusId: block?.[0]?.stimulusId || "",
    };
  }

  function targetDifficulty(position, total, mode, ability = 0.5, lastOutcome = null) {
    if (mode !== "chapter") return clamp(0.48 + ability * 0.18);
    const progress = total > 1 ? position / (total - 1) : 0;
    let target = 0.28 + progress * 0.42 + ability * 0.16;
    if (lastOutcome === "correct") target += 0.1;
    if (lastOutcome === "wrong") target -= 0.1;
    return clamp(target, 0.2, 0.88);
  }

  function studentAbility(answers) {
    const records = answers instanceof Map ? [...answers.values()] : Object.values(answers || {});
    const attempts = records.reduce((sum, answer) => sum + Number(answer?.attempts || 0), 0);
    const correct = records.reduce((sum, answer) => sum + Number(answer?.correctAttempts || 0), 0);
    return attempts ? clamp(correct / attempts) : 0.5;
  }

  function orderBlocks(blocks, options = {}) {
    const mode = options.mode || "chapter";
    const metrics = options.metrics;
    const answers = options.answers;
    const seed = options.seed || "sirius-adaptive-v1";
    const reportedIds = options.reportedIds instanceof Set ? options.reportedIds : new Set(options.reportedIds || []);
    const ability = studentAbility(answers);
    const remaining = (blocks || []).map((block, index) => ({
      block,
      index,
      stats: blockStats(block, metrics, answers),
      reported: blockHasReported(block, reportedIds),
    }));
    const normal = remaining.filter((item) => !item.reported);
    const reported = remaining.filter((item) => item.reported);
    const ordered = [];
    let lastChapter = "";
    let lastOutcome = options.lastOutcome || null;
    const selectFrom = (pool, position, challengeSlot = false) => {
      if (!pool.length) return null;
      const target = challengeSlot ? 0.75 : targetDifficulty(position, blocks.length, mode, ability, lastOutcome);
      const scored = pool.map((item) => {
        const sameChapter = item.stats.chapter && item.stats.chapter === lastChapter;
        const proximity = Math.abs(item.stats.difficulty - target);
        const weakBonus = item.stats.weak * (mode === "chapter" ? 0.14 : 0.04);
        const calibration = Number(metrics ? normalizedMetric(metrics, item.block[0])?.attempts || 0 : 0) < 30 ? 0.04 : 0;
        const varietyPenalty = sameChapter ? 0.035 : 0;
        const challengePenalty = challengeSlot ? -item.stats.difficulty * 0.12 : 0;
        const tie = stableRank(`${seed}|${position}|${mode}`, blockKey(item.block));
        return { item, score: proximity - weakBonus - calibration + varietyPenalty + challengePenalty + tie * 0.0001 };
      });
      scored.sort((a, b) => a.score - b.score || a.item.index - b.item.index);
      const chosen = scored[0]?.item || null;
      if (chosen) {
        const index = pool.indexOf(chosen);
        if (index >= 0) pool.splice(index, 1);
      }
      return chosen;
    };

    for (let position = 0; position < blocks.length; position += 1) {
      const challengeSlot = mode === "chapter" && position >= 3 && position % 5 === 3;
      const chosen = selectFrom(normal, position, challengeSlot) || selectFrom(reported, position, false);
      if (!chosen) break;
      ordered.push(chosen.block);
      lastChapter = chosen.stats.chapter;
      const record = normalizedAnswer(answers, chosen.block[0]);
      lastOutcome = record ? (Number(record.correctAttempts || 0) > 0 ? "correct" : "wrong") : null;
    }
    while (reported.length) ordered.push(selectFrom(reported, ordered.length, false).block);
    return ordered;
  }

  function buildOrder(questions, options = {}) {
    const list = Array.isArray(questions) ? questions : [];
    if (!list.length) return [];
    const groupIntoBlocks = options.groupIntoBlocks;
    const flattenBlocks = options.flattenBlocks;
    if (typeof groupIntoBlocks !== "function" || typeof flattenBlocks !== "function") return list.slice();
    return flattenBlocks(orderBlocks(groupIntoBlocks(list), options));
  }

  return {
    stableSeedNumber,
    seededRandom,
    questionDifficulty,
    blockHasReported,
    choiceAmbiguity,
    orderBlocks,
    buildOrder,
  };
});

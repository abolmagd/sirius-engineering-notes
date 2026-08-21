// ═══════════════════════════════════════════════════════════════
// SIRIUS — Filter, group, and prepare a student display queue
//
// This is the presentation pipeline around the ordering functions: filters
// narrow the candidate pool first, shared stimuli stay together, and reported
// blocks move behind normal blocks. A score function can be injected from
// question-score.js or adaptive-ordering.js.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QuestionPresentation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function stableNumber(value) {
    let result = 2166136261;
    for (const char of String(value ?? "")) result = Math.imul(result ^ char.charCodeAt(0), 16777619) >>> 0;
    return result >>> 0;
  }

  function hasSelectedSource(question, selectedSources) {
    if (!selectedSources || !selectedSources.size) return true;
    const sources = Array.isArray(question?.sources) ? question.sources : [];
    return sources.some((source) => selectedSources.has(source));
  }

  function matchesFilters(question, filters = {}) {
    const exactFields = ["year", "module", "subject", "chapter", "questionType"];
    if (exactFields.some((field) => filters[field] && question?.[field] !== filters[field])) return false;
    if (filters.excludeIds && filters.excludeIds.has(question?.id)) return false;
    return hasSelectedSource(question, filters.sources);
  }

  function filterQuestions(questions, filters = {}) {
    return (Array.isArray(questions) ? questions : []).filter((question) => matchesFilters(question, filters));
  }

  function groupStimuli(questions) {
    const blocks = [];
    const byStimulus = new Map();
    (questions || []).forEach((question, index) => {
      const stimulusId = String(question?.stimulusId ?? "").trim();
      if (!stimulusId) {
        blocks.push({ stimulusId: "", entries: [{ question, index }] });
        return;
      }
      let block = byStimulus.get(stimulusId);
      if (!block) {
        block = { stimulusId, entries: [] };
        byStimulus.set(stimulusId, block);
        blocks.push(block);
      }
      block.entries.push({ question, index });
    });

    return blocks.map((block) => block.entries
      .slice()
      .sort((left, right) => {
        const a = Number(left.question?.stimulusOrder);
        const b = Number(right.question?.stimulusOrder);
        const orderA = Number.isFinite(a) ? a : Number.POSITIVE_INFINITY;
        const orderB = Number.isFinite(b) ? b : Number.POSITIVE_INFINITY;
        return orderA - orderB || left.index - right.index;
      })
      .map((entry) => entry.question));
  }

  function flatten(blocks) {
    return (blocks || []).flatMap((block) => block || []);
  }

  function defaultScore(question) {
    return {
      selectionScore: Number.isFinite(Number(question?.selectionScore)) ? Number(question.selectionScore) : 0.5,
      reportSignal: Number(question?.reportCount || 0) > 0 ? 1 : 0,
    };
  }

  function orderBlocks(blocks, options = {}) {
    const scoreFn = typeof options.scoreQuestion === "function" ? options.scoreQuestion : defaultScore;
    const seed = options.seed || "sirius-display-v1";
    return (blocks || []).map((block, index) => {
      const scores = block.map(scoreFn);
      const score = scores.length
        ? scores.reduce((sum, value) => sum + Number(value?.selectionScore ?? 0.5), 0) / scores.length
        : 0.5;
      const reported = scores.some((value) => Number(value?.reportSignal || 0) > 0);
      return { block, index, score, reported, tie: stableNumber(`${seed}|${block.map((q) => q?.id).join(",")}`) };
    }).sort((left, right) => {
      // Moderation-pending content stays available but follows normal blocks.
      if (left.reported !== right.reported) return left.reported ? 1 : -1;
      return left.score - right.score || left.tie - right.tie || left.index - right.index;
    }).map((item) => item.block);
  }

  function buildDisplayQueue(questions, options = {}) {
    const filtered = filterQuestions(questions, options.filters);
    const blocks = groupStimuli(filtered);
    return flatten(orderBlocks(blocks, options));
  }

  return {
    matchesFilters,
    filterQuestions,
    groupStimuli,
    orderBlocks,
    buildDisplayQueue,
  };
});

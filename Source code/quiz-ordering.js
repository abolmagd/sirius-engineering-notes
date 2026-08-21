// ═══════════════════════════════════════════════════════════════
// SIRIUS — Quiz ordering (shared image/case stimulus blocks)
// Pure, dependency-free logic shared by the browser app and Node tests.
//
// A "block" is a group of questions that must stay together and in order:
//   • Questions sharing the same stimulusId form one block, sorted by
//     stimulusOrder (missing order goes last, ties keep original order).
//   • Every question without a stimulusId is its own single-question block.
//
// Shuffling happens at the BLOCK level, never inside a block, so a shared
// image and its questions can never be split apart or interleaved with
// unrelated questions.
//
// Exposed as a UMD/CommonJS module because app.js is a classic script,
// not an ES module.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.QuizOrdering = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function orderValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }

  function stimulusKey(question) {
    if (!question) return "";
    const sid = question.stimulusId;
    return sid == null || sid === "" ? "" : String(sid);
  }

  // Partition questions into blocks. Block first-appearance order is preserved
  // so the result is deterministic before any shuffle.
  function groupIntoBlocks(questions) {
    const list = Array.isArray(questions) ? questions : [];
    const blocks = [];
    const groups = new Map();

    list.forEach((question, index) => {
      const key = stimulusKey(question);
      if (!key) {
        blocks.push({ stimulusId: "", entries: [{ question, index }] });
        return;
      }
      let block = groups.get(key);
      if (!block) {
        block = { stimulusId: key, entries: [] };
        groups.set(key, block);
        blocks.push(block);
      }
      block.entries.push({ question, index });
    });

    return blocks.map((block) => {
      if (block.stimulusId) {
        // Stable sort by stimulusOrder; equal/missing orders keep original order.
        block.entries.sort((a, b) => {
          const diff = orderValue(a.question.stimulusOrder) - orderValue(b.question.stimulusOrder);
          return diff !== 0 ? diff : a.index - b.index;
        });
      }
      return block.entries.map((entry) => entry.question);
    });
  }

  function flattenBlocks(blocks) {
    const out = [];
    (blocks || []).forEach((block) => (block || []).forEach((question) => out.push(question)));
    return out;
  }

  function fisherYates(items, rng) {
    const rand = typeof rng === "function" ? rng : Math.random;
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  // Shuffle whole blocks, then flatten back to a plain question list.
  function blockShuffle(questions, rng) {
    return flattenBlocks(fisherYates(groupIntoBlocks(questions), rng));
  }

  // A block's weight is the highest weight of any question inside it, so a
  // group containing a "due for review" question surfaces as early as that
  // question would on its own.
  function blockWeight(block, weightFn) {
    if (typeof weightFn !== "function") return 1;
    let max = 0;
    block.forEach((question) => {
      const w = Number(weightFn(question));
      if (Number.isFinite(w) && w > max) max = w;
    });
    return max > 0 ? max : 1;
  }

  // Weighted shuffle without replacement, at the block level.
  function weightedBlockShuffle(questions, weightFn, rng) {
    const rand = typeof rng === "function" ? rng : Math.random;
    const ordered = groupIntoBlocks(questions)
      .map((block, index) => {
        const weight = blockWeight(block, weightFn);
        // Exponential race: sorting one random key per block produces the
        // same weighted-without-replacement distribution in O(n log n),
        // instead of repeatedly scanning and splicing an O(n²) pool.
        const sample = Math.max(Number.EPSILON, Math.min(1, rand()));
        return { block, index, key: -Math.log(sample) / weight };
      })
      .sort((a, b) => a.key - b.key || a.index - b.index)
      .map((item) => item.block);
    return flattenBlocks(ordered);
  }

  return {
    groupIntoBlocks,
    flattenBlocks,
    blockShuffle,
    weightedBlockShuffle,
  };
});

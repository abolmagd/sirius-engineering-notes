// ═══════════════════════════════════════════════════════════════
// SIRIUS — Duplicate-question filter (manual `duplicateId` tag matching)
// Pure, dependency-free logic shared by the browser app (app.js)
// and Node tests.
//
// The admin manually tags 2+ question rows as "the same question" by
// giving them the same free-text `duplicateId` (mirrors `stimulusId`,
// but a plain tag with no linked table). When a student turns on the
// "Skip duplicate questions" toggle, only one member of each tagged
// group is kept — the one with the lexicographically lowest `id`, so
// the choice is deterministic and stable across renders/sessions.
// Untagged questions (`duplicateId === ''`) never group with each
// other.
//
// UMD/CommonJS because app.js is a classic script, not an ES module.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DuplicateFilter = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // From a list of questions, drop every question but one per non-empty
  // `duplicateId` group. Only questions already present in the input are
  // considered — if a group has just one member here, it passes through
  // untouched. Questions with no `duplicateId` are always kept and never
  // grouped with each other (not even with other untagged questions).
  function dedupeQuestions(questions) {
    const list = Array.isArray(questions) ? questions : [];
    const survivorIdByGroup = new Map();
    list.forEach((question) => {
      const groupId = question.duplicateId;
      if (!groupId) return;
      const current = survivorIdByGroup.get(groupId);
      if (current === undefined || question.id < current) {
        survivorIdByGroup.set(groupId, question.id);
      }
    });
    return list.filter((question) => {
      if (!question.duplicateId) return true;
      return question.id === survivorIdByGroup.get(question.duplicateId);
    });
  }

  return { dedupeQuestions };
});

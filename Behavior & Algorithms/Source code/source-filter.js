// ═══════════════════════════════════════════════════════════════
// SIRIUS — Source filter (per-question "sources" tag matching)
// Pure, dependency-free logic shared by the browser app (app.js)
// and Node tests.
//
// Each question may carry zero or more free-text `sources` (e.g.
// "195", "196", "Department book"). The exam setup screen's Sources
// checklist narrows practice to questions carrying ANY checked value
// (OR semantics), exactly like the existing multi-chapter checklist.
//
// UMD/CommonJS because app.js is a classic script, not an ES module.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SourceFilter = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Does one question's `sources` array satisfy the current Sources
  // checklist selection?
  //   mode "none"   → nothing checked, nothing matches.
  //   mode "all"    → nothing narrowed (default/untouched) — every
  //                   question matches, regardless of its own sources.
  //   mode "custom" → matches if the question has AT LEAST ONE of the
  //                   selected values (OR). A question with no sources
  //                   never matches a custom selection.
  function matchesSourceFilter(questionSources, selectedSources, mode) {
    if (mode === "none") return false;
    if (mode !== "custom") return true; // "all" (and any unrecognized/default mode)
    const list = Array.isArray(questionSources) ? questionSources : [];
    return list.some((value) => selectedSources.has(value));
  }

  // Distinct source values across a list of questions, sorted for
  // stable checklist rendering.
  function uniqueSources(questions) {
    const set = new Set();
    (Array.isArray(questions) ? questions : []).forEach((question) => {
      (Array.isArray(question.sources) ? question.sources : []).forEach((value) => {
        if (value) set.add(value);
      });
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  // The session-key segment contributed by the Sources filter, or
  // `null` when the filter is at its default "all" state — so a
  // session saved before this feature (or by a student who never
  // touches the filter) keeps its exact legacy key, and only actively
  // narrowed sessions get their own resume slot.
  function sessionKeySegment(mode, sources) {
    if (mode === "all") return null;
    const list = Array.isArray(sources) ? sources : [];
    return list.length ? list.join("+") : "none";
  }

  return { matchesSourceFilter, uniqueSources, sessionKeySegment };
});

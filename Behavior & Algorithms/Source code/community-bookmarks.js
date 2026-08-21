/*
 * Pure filtering for the "Most bookmarked by students" list.
 *
 * The public example keeps curriculum membership as the scope and lets the
 * reader narrow the list through explicit module and subject selections.
 *
 * No DOM, no globals, no network -- everything here is a pure function over the
 * questions already in memory and the counts already in the peer cache.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CommunityBookmarks = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const countOf = (counts, id) => (counts && counts[id] && counts[id].count) || 0;

  // Groups questions by one field and totals their bookmark counts. Module
  // controls include zero-count groups so every currently accessible module is
  // discoverable; the ranked question list itself still contains only rows
  // that students actually bookmarked.
  function optionsBy(questions, counts, field, filter, includeEmpty) {
    const totals = new Map();
    (questions || []).forEach(function (question) {
      if (filter && !filter(question)) return;
      const name = String((question && question[field]) || "").trim();
      if (!name) return;
      const count = countOf(counts, question.id);
      if (count <= 0 && !includeEmpty) return;
      totals.set(name, (totals.get(name) || 0) + count);
    });
    return Array.from(totals, function (entry) {
      return { name: entry[0], count: entry[1] };
    }).sort(function (a, b) {
      return b.count - a.count || a.name.localeCompare(b.name);
    });
  }

  function moduleOptions(questions, counts) {
    return optionsBy(questions, counts, "module", null, true);
  }

  function subjectOptions(questions, counts, module) {
    if (!module) return [];
    return optionsBy(questions, counts, "subject", function (question) {
      return String((question && question.module) || "").trim() === module;
    });
  }

  /*
   * Decides what is selected when the page opens.
   *
   * Exactly one open module means there is nothing to ask, so it selects itself
   * -- the common case early in a rotation. More than one leaves module null so
   * the page can show "Choose a module". A stored choice wins, but only while
   * that module is still among the student's open modules; after a promotion or
   * a schedule change it is discarded rather than showing an empty list.
   */
  function resolveSelection(stored, options) {
    const names = (options || []).map(function (option) { return option.name; });
    const storedModule = stored && stored.module ? String(stored.module) : null;
    if (storedModule && names.indexOf(storedModule) !== -1) {
      return { module: storedModule, subject: (stored && stored.subject) || "any" };
    }
    if (names.length === 1) return { module: names[0], subject: "any" };
    return { module: null, subject: "any" };
  }

  function filterRows(questions, counts, module, subject) {
    if (!module) return [];
    const wantSubject = subject && subject !== "any" ? String(subject) : null;
    return (questions || [])
      .filter(function (question) {
        if (String((question && question.module) || "").trim() !== module) return false;
        if (wantSubject && String((question && question.subject) || "").trim() !== wantSubject) return false;
        return countOf(counts, question.id) > 0;
      })
      .map(function (question) {
        return { question: question, count: countOf(counts, question.id) };
      })
      // Question id is the tie-break so equal counts keep a stable order
      // between renders instead of reshuffling under the student.
      .sort(function (a, b) {
        return b.count - a.count || String(a.question.id).localeCompare(String(b.question.id));
      });
  }

  return {
    moduleOptions: moduleOptions,
    subjectOptions: subjectOptions,
    resolveSelection: resolveSelection,
    filterRows: filterRows,
  };
});

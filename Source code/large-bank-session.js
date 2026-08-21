(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiriusLargeBankSession = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Educational state model only. Persistence and transport stay outside this file.
  var DEFAULT_BANK_PAGE_SIZE = 1000;
  var DEFAULT_SESSION_SIZE = 80;
  var DEFAULT_RENDER_BATCH_SIZE = 15;

  function asText(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function asList(value) {
    var values = Array.isArray(value) ? value : value ? [value] : [];
    var seen = Object.create(null);
    return values
      .map(asText)
      .filter(function (value) {
        if (!value || seen[value]) return false;
        seen[value] = true;
        return true;
      })
      .sort();
  }

  function normalizeScope(scope) {
    scope = scope || {};
    return {
      year: asText(scope.year),
      modules: asList(scope.modules || scope.module),
      subjects: asList(scope.subjects || scope.subject),
      chapters: asList(scope.chapters || scope.chapter),
      sources: asList(scope.sources || scope.source),
      dedup: Boolean(scope.dedup)
    };
  }

  function scopeKey(scope) {
    return JSON.stringify(normalizeScope(scope));
  }

  function questionFieldValues(question, singular, plural) {
    return asList(question[plural] || question[singular]);
  }

  function matchesSelection(question, selected, singular, plural) {
    if (!selected.length) return true;
    var values = questionFieldValues(question, singular, plural);
    return selected.some(function (value) {
      return values.indexOf(value) !== -1;
    });
  }

  function putInBucket(buckets, key, id) {
    key = asText(key);
    if (!key) return;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(id);
  }

  function uniqueIds(ids) {
    var seen = Object.create(null);
    return (ids || []).map(asText).filter(function (id) {
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function indexQuestionBank(questions) {
    var byId = Object.create(null);
    var byModule = Object.create(null);
    var byYear = Object.create(null);
    var bySource = Object.create(null);
    var byChapter = Object.create(null);

    (questions || []).forEach(function (question) {
      var id = asText(question && question.id);
      if (!id || byId[id]) return;

      var safeQuestion = Object.assign({}, question, { id: id });
      byId[id] = safeQuestion;
      putInBucket(byModule, safeQuestion.module, id);
      putInBucket(byYear, safeQuestion.year, id);
      questionFieldValues(safeQuestion, 'source', 'sources').forEach(function (source) {
        putInBucket(bySource, source, id);
      });
      questionFieldValues(safeQuestion, 'chapter', 'chapters').forEach(function (chapter) {
        var chapterKey = [safeQuestion.module, safeQuestion.subject, chapter].map(asText).join('::');
        putInBucket(byChapter, chapterKey, id);
      });
    });

    var allIds = Object.keys(byId).sort();
    return {
      byId: byId,
      byModule: byModule,
      byYear: byYear,
      bySource: bySource,
      byChapter: byChapter,
      allIds: allIds,
      size: allIds.length
    };
  }

  function candidateIds(index, scope) {
    var candidates = [];
    var selectedModules = scope.modules;
    var selectedYears = scope.year ? [scope.year] : [];
    var selectedSources = scope.sources;

    if (selectedModules.length) {
      selectedModules.forEach(function (moduleName) {
        candidates = candidates.concat(index.byModule[moduleName] || []);
      });
    } else if (selectedYears.length) {
      selectedYears.forEach(function (year) {
        candidates = candidates.concat(index.byYear[year] || []);
      });
    } else if (selectedSources.length) {
      selectedSources.forEach(function (source) {
        candidates = candidates.concat(index.bySource[source] || []);
      });
    } else {
      candidates = index.allIds;
    }

    return uniqueIds(candidates);
  }

  function pageQuestionIds(index, options) {
    options = options || {};
    var scope = normalizeScope(options.scope);
    var offset = Math.max(0, Number(options.offset) || 0);
    var limit = Math.max(1, Number(options.limit) || DEFAULT_SESSION_SIZE);
    var ids = candidateIds(index, scope).filter(function (id) {
      var question = index.byId[id];
      return matchesSelection(question, scope.modules, 'module', 'modules') &&
        matchesSelection(question, scope.subjects, 'subject', 'subjects') &&
        matchesSelection(question, scope.chapters, 'chapter', 'chapters') &&
        matchesSelection(question, scope.sources, 'source', 'sources') &&
        (!scope.year || asText(question.year) === scope.year);
    });

    return ids.slice(offset, offset + limit);
  }

  function buildSessionKey(options) {
    options = options || {};
    return JSON.stringify({
      mode: asText(options.mode || 'chapter'),
      scope: normalizeScope(options.scope),
      timedCount: options.timedCount === undefined || options.timedCount === null ? null : Number(options.timedCount),
      seed: asText(options.seed)
    });
  }

  function hasQuestion(state, questionId) {
    return state.questionIds.indexOf(questionId) !== -1;
  }

  function sessionCopy(state) {
    return {
      sessionKey: state.sessionKey,
      questionIds: state.questionIds.slice(),
      answers: Object.assign(Object.create(null), state.answers),
      bookmarkAdds: Object.assign(Object.create(null), state.bookmarkAdds),
      bookmarkRemovals: Object.assign(Object.create(null), state.bookmarkRemovals),
      bookmarks: state.bookmarks.slice(),
      revision: state.revision,
      updatedAt: state.updatedAt
    };
  }

  function activeBookmarks(adds, removals, questionIds) {
    return questionIds.filter(function (id) {
      var addedAt = Number(adds[id] || 0);
      var removedAt = Number(removals[id] || 0);
      return addedAt > removedAt;
    });
  }

  function createSessionState(sessionKey, questionIds) {
    var state = {
      sessionKey: asText(sessionKey),
      questionIds: uniqueIds(questionIds),
      answers: Object.create(null),
      bookmarkAdds: Object.create(null),
      bookmarkRemovals: Object.create(null),
      bookmarks: [],
      revision: 0,
      updatedAt: 0
    };
    state.bookmarks = activeBookmarks(state.bookmarkAdds, state.bookmarkRemovals, state.questionIds);
    return state;
  }

  function recordAnswer(state, questionId, result, updatedAt) {
    questionId = asText(questionId);
    if (!hasQuestion(state, questionId)) return state;
    result = result || {};
    var next = sessionCopy(state);
    var previous = state.answers[questionId] || {
      attempts: 0,
      correctAttempts: 0,
      activeMs: 0,
      lastAnswer: null,
      updatedAt: 0
    };
    var timestamp = Number(updatedAt) || Date.now();

    next.answers[questionId] = {
      attempts: previous.attempts + 1,
      correctAttempts: previous.correctAttempts + (result.correct ? 1 : 0),
      activeMs: previous.activeMs + Math.max(0, Number(result.activeMs) || 0),
      lastAnswer: result.answer === undefined ? previous.lastAnswer : asText(result.answer),
      updatedAt: timestamp
    };
    next.revision += 1;
    next.updatedAt = Math.max(state.updatedAt, timestamp);
    return next;
  }

  function setBookmark(state, questionId, active, updatedAt) {
    questionId = asText(questionId);
    if (!hasQuestion(state, questionId)) return state;
    var next = sessionCopy(state);
    var timestamp = Number(updatedAt) || Date.now();
    var target = active ? next.bookmarkAdds : next.bookmarkRemovals;
    target[questionId] = Math.max(Number(target[questionId] || 0), timestamp);
    next.bookmarks = activeBookmarks(next.bookmarkAdds, next.bookmarkRemovals, next.questionIds);
    next.revision += 1;
    next.updatedAt = Math.max(state.updatedAt, timestamp);
    return next;
  }

  function mergeMaxMap(left, right) {
    var merged = Object.assign(Object.create(null), left || {});
    Object.keys(right || {}).forEach(function (key) {
      merged[key] = Math.max(Number(merged[key] || 0), Number(right[key] || 0));
    });
    return merged;
  }

  function mergeAnswer(left, right) {
    if (!left) return right;
    if (!right) return left;
    var newer = Number(right.updatedAt || 0) >= Number(left.updatedAt || 0) ? right : left;
    return {
      attempts: Math.max(Number(left.attempts || 0), Number(right.attempts || 0)),
      correctAttempts: Math.max(Number(left.correctAttempts || 0), Number(right.correctAttempts || 0)),
      activeMs: Math.max(Number(left.activeMs || 0), Number(right.activeMs || 0)),
      lastAnswer: newer.lastAnswer,
      updatedAt: Math.max(Number(left.updatedAt || 0), Number(right.updatedAt || 0))
    };
  }

  function mergeSessionStates(left, right) {
    if (!left || !right || left.sessionKey !== right.sessionKey) return null;
    var merged = createSessionState(left.sessionKey, uniqueIds(left.questionIds.concat(right.questionIds)));
    var answerIds = uniqueIds(Object.keys(left.answers || {}).concat(Object.keys(right.answers || {})));
    answerIds.forEach(function (id) {
      merged.answers[id] = mergeAnswer(left.answers[id], right.answers[id]);
    });
    merged.bookmarkAdds = mergeMaxMap(left.bookmarkAdds, right.bookmarkAdds);
    merged.bookmarkRemovals = mergeMaxMap(left.bookmarkRemovals, right.bookmarkRemovals);
    merged.bookmarks = activeBookmarks(merged.bookmarkAdds, merged.bookmarkRemovals, merged.questionIds);
    merged.revision = Math.max(left.revision || 0, right.revision || 0) + 1;
    merged.updatedAt = Math.max(left.updatedAt || 0, right.updatedAt || 0);
    return merged;
  }

  function sessionMemoryPlan(totalQuestions, options) {
    options = options || {};
    var total = Math.max(0, Number(totalQuestions) || 0);
    var bankPageSize = Math.max(1, Number(options.bankPageSize) || DEFAULT_BANK_PAGE_SIZE);
    var sessionSize = Math.max(1, Number(options.sessionSize) || DEFAULT_SESSION_SIZE);
    var renderBatchSize = Math.max(1, Number(options.renderBatchSize) || DEFAULT_RENDER_BATCH_SIZE);
    return {
      totalQuestions: total,
      bankPages: Math.ceil(total / bankPageSize),
      questionsLoadedForSession: Math.min(total, sessionSize),
      renderBatches: Math.ceil(Math.min(total, sessionSize) / renderBatchSize),
      bankPageSize: bankPageSize,
      sessionSize: sessionSize,
      renderBatchSize: renderBatchSize
    };
  }

  return {
    normalizeScope: normalizeScope,
    scopeKey: scopeKey,
    uniqueIds: uniqueIds,
    indexQuestionBank: indexQuestionBank,
    pageQuestionIds: pageQuestionIds,
    buildSessionKey: buildSessionKey,
    createSessionState: createSessionState,
    recordAnswer: recordAnswer,
    setBookmark: setBookmark,
    mergeSessionStates: mergeSessionStates,
    sessionMemoryPlan: sessionMemoryPlan
  };
});

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiriusQueryPlans = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MAX_PAGE_SIZE = 1000;

  function text(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function list(value) {
    var values = Array.isArray(value) ? value : value ? [value] : [];
    var seen = Object.create(null);
    return values.map(text).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    }).sort();
  }

  function pageWindow(page, pageSize) {
    var safePage = Math.max(1, Number(page) || 1);
    var safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || 100));
    return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
  }

  function buildQuestionPagePlan(options) {
    options = options || {};
    var window = pageWindow(options.page, options.pageSize);
    return {
      kind: 'question-page',
      read: ['question_catalog', 'question_stimulus', 'stimulus_groups', 'question_sources'],
      select: ['question_id', 'year_key', 'module_key', 'subject_key', 'chapter_key', 'stimulus_id', 'media_ref', 'source_key'],
      filters: {
        year: text(options.year),
        modules: list(options.modules),
        subjects: list(options.subjects),
        chapters: list(options.chapters),
        sources: list(options.sources)
      },
      orderBy: ['question_id', 'display_position'],
      page: window,
      notes: ['bounded-read', 'deduplicate-stimulus-before-hydration']
    };
  }

  function buildSessionReadPlan(options) {
    options = options || {};
    var ids = list(options.questionIds);
    return {
      kind: 'study-session-read',
      read: ['study_sessions', 'session_questions', 'study_answers'],
      select: ['session_key', 'question_id', 'display_position', 'attempt_count', 'correct_count', 'active_ms', 'updated_at'],
      filters: {
        sessionKey: text(options.sessionKey),
        questionIds: ids
      },
      orderBy: ['display_position', 'question_id'],
      notes: ['same-session-only', 'answer-state-is-keyed-by-question-id']
    };
  }

  function buildAggregatePlan(options) {
    options = options || {};
    return {
      kind: 'aggregate-view',
      read: ['question_engagement_rollups', 'public_ranking_rollups'],
      select: ['question_id', 'bookmark_count', 'report_count', 'period_key', 'alias_key', 'solved_count', 'score_total'],
      filters: {
        questionIds: list(options.questionIds),
        period: text(options.period)
      },
      orderBy: ['period_key', 'solved_count', 'question_id'],
      page: pageWindow(options.page, options.pageSize),
      notes: ['aggregate-only', 'bounded-response', 'no-private-profile-join']
    };
  }

  return {
    pageWindow: pageWindow,
    buildQuestionPagePlan: buildQuestionPagePlan,
    buildSessionReadPlan: buildSessionReadPlan,
    buildAggregatePlan: buildAggregatePlan
  };
});

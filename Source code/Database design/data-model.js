(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiriusDataModel = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Logical teaching model only. It is not a production schema or migration.
  var TABLES = [
    {
      name: 'question_catalog',
      domain: 'content',
      primaryKey: ['question_id'],
      fields: ['question_id', 'year_key', 'module_key', 'subject_key', 'chapter_key', 'image_ref'],
      indexes: ['curriculum_scope', 'chapter_key']
    },
    {
      name: 'stimulus_groups',
      domain: 'content',
      primaryKey: ['stimulus_id'],
      fields: ['stimulus_id', 'media_ref', 'position_count'],
      indexes: ['stimulus_id']
    },
    {
      name: 'question_stimulus',
      domain: 'content_bridge',
      primaryKey: ['question_id', 'stimulus_id'],
      fields: ['question_id', 'stimulus_id', 'display_position'],
      indexes: ['stimulus_id', 'question_id']
    },
    {
      name: 'question_sources',
      domain: 'content_bridge',
      primaryKey: ['question_id', 'source_key'],
      fields: ['question_id', 'source_key'],
      indexes: ['source_key', 'question_id']
    },
    {
      name: 'study_sessions',
      domain: 'study_state',
      primaryKey: ['session_key'],
      fields: ['session_key', 'mode', 'filter_fingerprint', 'ordering_seed', 'updated_at'],
      indexes: ['updated_at', 'filter_fingerprint']
    },
    {
      name: 'session_questions',
      domain: 'study_state',
      primaryKey: ['session_key', 'question_id'],
      fields: ['session_key', 'question_id', 'display_position'],
      indexes: ['session_key', 'question_id']
    },
    {
      name: 'study_answers',
      domain: 'study_state',
      primaryKey: ['session_key', 'question_id'],
      fields: ['session_key', 'question_id', 'attempt_count', 'correct_count', 'active_ms', 'updated_at'],
      indexes: ['session_key', 'updated_at']
    },
    {
      name: 'question_engagement_rollups',
      domain: 'aggregate',
      primaryKey: ['question_id'],
      fields: ['question_id', 'bookmark_count', 'report_count', 'updated_at'],
      indexes: ['bookmark_count', 'report_count']
    },
    {
      name: 'public_ranking_rollups',
      domain: 'aggregate',
      primaryKey: ['period_key', 'alias_key'],
      fields: ['period_key', 'alias_key', 'solved_count', 'score_total', 'updated_at'],
      indexes: ['period_key', 'solved_count']
    }
  ];

  var RELATIONSHIPS = [
    { from: 'question_catalog', to: 'question_stimulus', on: 'question_id', cardinality: 'one-to-many' },
    { from: 'stimulus_groups', to: 'question_stimulus', on: 'stimulus_id', cardinality: 'one-to-many' },
    { from: 'question_catalog', to: 'question_sources', on: 'question_id', cardinality: 'one-to-many' },
    { from: 'study_sessions', to: 'session_questions', on: 'session_key', cardinality: 'one-to-many' },
    { from: 'question_catalog', to: 'session_questions', on: 'question_id', cardinality: 'one-to-many' },
    { from: 'session_questions', to: 'study_answers', on: 'session_key + question_id', cardinality: 'one-to-one' },
    { from: 'question_catalog', to: 'question_engagement_rollups', on: 'question_id', cardinality: 'one-to-one' }
  ];

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function listTables() {
    return TABLES.map(function (table) { return table.name; });
  }

  function describeTable(name) {
    var table = TABLES.find(function (candidate) { return candidate.name === String(name); });
    return table ? copy(table) : null;
  }

  function listRelationships() {
    return copy(RELATIONSHIPS);
  }

  function tablesByDomain(domain) {
    return TABLES.filter(function (table) { return table.domain === String(domain); })
      .map(function (table) { return table.name; });
  }

  return {
    listTables: listTables,
    describeTable: describeTable,
    listRelationships: listRelationships,
    tablesByDomain: tablesByDomain
  };
});

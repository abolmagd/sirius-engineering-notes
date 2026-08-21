(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SiriusRelationshipGraph = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EDGES = [
    ['question_catalog', 'question_stimulus'],
    ['stimulus_groups', 'question_stimulus'],
    ['question_catalog', 'question_sources'],
    ['study_sessions', 'session_questions'],
    ['question_catalog', 'session_questions'],
    ['session_questions', 'study_answers'],
    ['question_catalog', 'question_engagement_rollups']
  ];

  function adjacent(tableName) {
    var name = String(tableName);
    var output = [];
    EDGES.forEach(function (edge) {
      if (edge[0] === name) output.push(edge[1]);
      if (edge[1] === name) output.push(edge[0]);
    });
    return output.filter(function (value, index, values) { return values.indexOf(value) === index; }).sort();
  }

  function pathBetween(start, target) {
    start = String(start);
    target = String(target);
    if (start === target) return [start];

    var queue = [[start]];
    var visited = Object.create(null);
    visited[start] = true;

    while (queue.length) {
      var path = queue.shift();
      var next = adjacent(path[path.length - 1]);
      for (var index = 0; index < next.length; index += 1) {
        var candidate = next[index];
        if (visited[candidate]) continue;
        var extended = path.concat(candidate);
        if (candidate === target) return extended;
        visited[candidate] = true;
        queue.push(extended);
      }
    }

    return [];
  }

  function explainPath(start, target) {
    return pathBetween(start, target).map(function (table, index, path) {
      return index === path.length - 1 ? table : table + ' ->';
    });
  }

  return {
    adjacent: adjacent,
    pathBetween: pathBetween,
    explainPath: explainPath
  };
});

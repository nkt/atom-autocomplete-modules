const escapeRegExp = require('lodash.escaperegexp');

module.exports = {
  regexModuleExistOnLine: /=require\([`'"]|(?:^|\s)require\([`'"]|^import\s.+from\s+["']|^import\s+["']|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/,

  regexOnCjsModule: function(prefix) {
    return new RegExp(`require\\([\`'"]((?:[^'"]*)*${escapeRegExp(prefix)})`);
  },

  regexOnEs6Module: function(prefix) {
    return new RegExp(`(?:from|import)\\s+['"]((?:[^'"]*)${escapeRegExp(prefix)})`);
  },

  regexOnEs6Export: function(prefix) {
    return new RegExp(`(?:import\\s+{|import)\\s*((?:.*?)${escapeRegExp(prefix)})`);
  },

  regexOnCjsExport: function(prefix) {
    return new RegExp(`(?:var|const|let)\\s+\\{\\s*((?:.*?)${escapeRegExp(prefix)})`, 'i');
  }
}

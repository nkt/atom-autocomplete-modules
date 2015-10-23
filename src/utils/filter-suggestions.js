const fuzzaldrin = require('fuzzaldrin');

function filterSuggestions(prefix, suggestions) {
  return fuzzaldrin.filter(suggestions, prefix, {
    key: 'text'
  });
}

module.exports = filterSuggestions;

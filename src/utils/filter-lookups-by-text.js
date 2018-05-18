const fuzzaldrin = require('fuzzaldrin');

module.exports = function filterByText(prefix) {
  return function getRelevantSuggestions(suggestions) {
    return fuzzaldrin.filter(suggestions, prefix, {
      key: 'text'
    });
  }
}

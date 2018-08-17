const fuzzaldrin = require('fuzzaldrin');

module.exports = function filterByText(suggestions, prefix) {
  return fuzzaldrin.filter(suggestions, prefix, {
    key: 'text'
  });
}

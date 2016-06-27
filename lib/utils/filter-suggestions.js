'use babel';

const fuzzaldrin = require('fuzzaldrin');

/**
 * Filter out suggestions paths that does not contain prefix
 * @param  {string} prefix
 * @param  {Object[]} suggestions
 * @return {Object[]}
 */
module.exports = function filterSuggestions(prefix, suggestions) {
  const options = {key: 'text'};
  return fuzzaldrin.filter(suggestions, prefix, options);
};

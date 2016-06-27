'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const escapeRegExp = require('lodash.escaperegexp');

const filterSuggestions = require('./filter-suggestions');
const normalizeLocal = require('./normalize-local');

// TODO: documentation
module.exports = function lookupLocal(prefix, dirname) {
  let filterPrefix = prefix.replace(path.dirname(prefix), '').replace('/', '');
  if (filterPrefix[filterPrefix.length - 1] === '/') {
    filterPrefix = '';
  }

  const includeExtension = atom.config.get('autocomplete-modules.includeExtension');
  let lookupDirname = path.resolve(dirname, prefix);
  if (filterPrefix) {
    lookupDirname = lookupDirname.replace(new RegExp(`${escapeRegExp(filterPrefix)}$`), '');
  }

  return readdir(lookupDirname)
    .catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return [];
    })
    .filter((filename) => filename[0] !== '.')
    .map((pathname) => ({
      text: includeExtension ? pathname : normalizeLocal(pathname),
      displayText: pathname,
      type: 'package'
    }))
    .then((suggestions) => filterSuggestions(filterPrefix, suggestions));
};

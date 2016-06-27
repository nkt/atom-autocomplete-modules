'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const escapeRegExp = require('lodash.escaperegexp');

/**
 * Helper function for getting the base path of the current project
 * @return {string|undefined}
 */
exports.getProjectPath = function getProjectPath() {
  return atom.project.getPaths()[0];
};

exports.lookupLocal = function lookupLocal(prefix, dirname) {
  let filterPrefix = prefix.replace(path.dirname(prefix), '').replace('/', '');
  if (filterPrefix[filterPrefix.length - 1] === '/') {
    filterPrefix = '';
  }

  const includeExtension = atom.config.get('autocomplete-modules.includeExtension');
  let lookupDirname = path.resolve(dirname, prefix);
  if (filterPrefix) {
    lookupDirname = lookupDirname.replace(new RegExp(`${escapeRegExp(filterPrefix)}$`), '');
  }

  return readdir(lookupDirname).catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }

    return [];
  }).filter(
    (filename) => filename[0] !== '.'
  ).map((pathname) => ({
    text: includeExtension ? pathname : this.normalizeLocal(pathname),
    displayText: pathname,
    type: 'package'
  })).then(
    (suggestions) => this.filterSuggestions(filterPrefix, suggestions)
  );
};

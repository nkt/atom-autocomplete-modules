'use babel';
const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const filterSuggestions = require('./filter-suggestions');

function lookupLocal(prefix, dirname, normalize) {
  let filterPrefix = prefix.replace(path.dirname(prefix), '').replace('/', '');
  if (filterPrefix[filterPrefix.length - 1] === '/') {
    filterPrefix = '';
  }
  const lookupDirname = path.resolve(dirname, prefix).replace(new RegExp(`${filterPrefix}$`), '');

  return readdir(lookupDirname).filter((filename) => {
    return filename[0] !== '.';
  }).map((pathname) => {
    return {
      text: normalize(pathname),
      displayText: pathname,
      type: 'package'
    };
  }).then((suggestions) => {
    return filterSuggestions(filterPrefix, suggestions);
  }).catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  });
}

module.exports = lookupLocal;

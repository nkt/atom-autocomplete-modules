'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const internalModules = require('./internal-modules');

const lookupLocal = require('./lookup-local');
const getProjectPath = require('./get-project-path');
const filterSuggestions = require('./filter-suggestions');

// TODO: documentation
module.exports = function lookupGlobal(prefix, vendor = 'node_modules') {
  const projectPath = getProjectPath();

  if (!projectPath) {
    return Promise.resolve([]);
  }

  const vendorPath = path.join(projectPath, vendor);
  if (prefix.indexOf('/') !== -1) {
    return lookupLocal(`./${prefix}`, vendorPath);
  }

  return readdir(vendorPath).catch((e) => {
    if (e.code !== 'ENOENT') {
      throw e;
    }

    return [];
  })
    .then((libs) => [...internalModules, ...libs])
    .map((lib) => ({
      text: lib,
      type: 'package'
    }))
    .then((suggestions) => filterSuggestions(prefix, suggestions));
};

const { default: extract } = require('extract-module-exports');
const resolveFrom = require('resolve-from');
const Promise = require('bluebird');

module.exports = function getExports(importFile, fromDir) {
  try {
    const absoluteFile = resolveFrom(fromDir, importFile);
    return extract(absoluteFile)
    .then(results => {
      return results.length ? results.map(e => e.name) : [];
    })
    .catch(e => {
      console.error([{
        scope: 'lib-lookup-exports-na',
        prefix: absoluteFile,
        additional: []
      }, e]); /* eslint no-console: "off" */
      return Promise.resolve([]);
    });
  } catch (e) {
    console.error([{
      scope: 'lib-lookup-exports-unable-to-resolve-path',
      prefix: importFile,
      additional: [{ fromDir: fromDir }]
    }, e]); /* eslint no-console: "off" */
    return Promise.resolve([]);
  }
};

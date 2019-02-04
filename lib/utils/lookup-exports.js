const { parse } = require('esm-exports');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const requireResolve = require('resolve-from');

module.exports = function getExports(importFile, fromDir) {
  try {
    const absoluteFile = requireResolve(fromDir, importFile);
    return readFile(absoluteFile, 'utf8')
    .then(stream => {
      return parse(stream);
    })
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

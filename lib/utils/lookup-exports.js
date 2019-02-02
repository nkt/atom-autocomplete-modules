const getExportsFromFile = require('get-exports-from-file');
const requireResolve = require('resolve-from');

module.exports = function getExports(importFile, fromDir) {
  try {
    const absoluteFile = requireResolve(fromDir, importFile);
    let logFileType = 'cjs';
    return getExportsFromFile.cjs(absoluteFile, true)
    .then(result => {
      if (result.exported.length > 0) return result.exported;

      logFileType = 'es6';
      return getExportsFromFile.es6(absoluteFile).then(result => result.exported);
    })
    .then(exporteds => {
      return exporteds.length ? exporteds.map(e => e.name) : [];
    })
    .catch(e => {
      console.error([{
        scope: 'lib-lookup-exports-na',
        prefix: importFile,
        additional: [{failedOn: logFileType}]
      }, e]); /* eslint no-console: "off" */
      return Promise.resolve([]);
    });
  } catch (e) {
    console.error([{
      scope: 'lib-lookup-exports-unable-to-resolve-path',
      prefix: importFile,
      additional: [{ fromDir: importFile }]
    }, e]); /* eslint no-console: "off" */
    return Promise.resolve([]);
  }
};

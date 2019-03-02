const { extname } = require('path');
const Promise = require('bluebird');
const { extensions, getFileDir } = require('../../utils/path-helpers');
class LocalLookup {
  constructor(lookupExports, resolveFileFullPath) {
    this.lookupExports = lookupExports;
    this.resolveFileFullPath = resolveFileFullPath;
  }

  isNeeded(importModule) { return importModule[0] === '.'; }

  massagePrefix(prefix) { return prefix; }

  getList(importModule, filePath) {
    const path = getFileDir(filePath);
    const getImportModuleAndExt = extname(importModule) === '' ?
      this._findModuleWithExt(importModule, path) : Promise.resolve(importModule);
    return getImportModuleAndExt
      .then(moduleName => this.lookupExports(moduleName, path))
      .then((suggestions) => suggestions.map((exportname) => ({
        text: exportname,
        displayText: exportname,
        type: 'property'
      })))
      .catch(e => {
          console.error([{
            scope: 'export-local',
            prefix: importModule,
            additional: []
          }, e.stack || e]); /* eslint no-console: "off" */
          return [];
        });
  }

  _findModuleWithExt(importModule, baseDir) {
    return Promise.all(extensions.map(ext => this.resolveFileFullPath(`${importModule}.${ext}`, baseDir).catch(() => Promise.resolve(''))))
    .then(results => {
      return results.find(r => !!r);
    });
  }
}

module.exports = LocalLookup;

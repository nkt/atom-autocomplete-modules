const { extname } = require('path');
const Promise = require('bluebird');
const { extensions } = require('../../utils/path-helpers');
const PATH_SLASH = process.platform === 'win32' ? '\\' : '/';
class LocalLookup {
  constructor(parseFile, lookupCommonJs, resolveFileFullPath) {
    this.parseFile = parseFile;
    this.lookupCommonJs = lookupCommonJs;
    this.resolveFileFullPath = resolveFileFullPath;
  }

  isNeeded(importModule) { return importModule[0] === '.'; }

  massagePrefix(prefix) { return prefix; }

  getList(importModule, filePath) {
    const path = filePath.substring(0, filePath.lastIndexOf(PATH_SLASH));
    const getImportModuleAndExt = extname(importModule) === '' ?
      this._findModuleWithExt(importModule, path) : Promise.resolve(importModule);
    return getImportModuleAndExt
      .then(moduleName => this.parseFile(moduleName, {basedir: path}))
      .then(results =>
        results.length > 0 ?
          results.map(entry => entry.name) :
          this.lookupCommonJs(`${importModule}.js`, path))
      .catch(() => {
        return this.lookupCommonJs(`${importModule}.js`, path);
      })
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

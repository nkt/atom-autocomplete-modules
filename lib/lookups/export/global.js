const { getFileDir } = require('../../utils/path-helpers');
class GlobalLookup {
  constructor(lookupExports) {
    this.lookupExports = lookupExports;
  }

  isNeeded(importModule) { return importModule[0] !== '.'; }

  massagePrefix(prefix) { return prefix; }

  getList(importModule, filePath) {
    const path = getFileDir(filePath);
    return this.lookupExports(importModule, path)
      .then((suggestions) => suggestions.map((exportname) => ({
        text: exportname,
        displayText: exportname,
        type: 'property'
      })))
      .catch(e => {
          console.error([{
            scope: 'export-global',
            prefix: importModule,
            additional: []
          }, e.stack || e]); /* eslint no-console: "off" */
          return [];
        });
  }
}

module.exports = GlobalLookup;

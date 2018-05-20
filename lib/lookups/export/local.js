const PATH_SLASH = process.platform === 'win32' ? '\\' : '/';

class LocalLookup {
  constructor(parseFile, lookupCommonJs) {
    this.parseFile = parseFile;
    this.lookupCommonJs = lookupCommonJs;
  }

  isNeeded(importModule) { return importModule[0] === '.'; }

  getList(importModule, filePath, configs) {
    const path = filePath.substring(0, filePath.lastIndexOf(PATH_SLASH));
    return this.parseFile(importModule, {basedir: path})
      .then(results => results.length > 0 ?
        results.map(entry => entry.name) :
        this.lookupCommonJs(`${importModule}.js`, path))
      .catch(() => {
        return this.lookupCommonJs(`${importModule}.js`, path);
      })
      .then((suggestions) => suggestions.map((exportname) => ({
        text: exportname,
        displayText: exportname,
        type: 'import'
      })));
  }
}

module.exports = LocalLookup;

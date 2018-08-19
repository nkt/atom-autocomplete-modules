class GlobalLookup {
  constructor(parseModule, lookupCommonJs, path, readFileSync, getProjectPath) {
    this.parseModule = parseModule;
    this.lookupCommonJs = lookupCommonJs;
    this.path = path;
    this.readFileSync = readFileSync;
    this.getProjectPath = getProjectPath;
  }

  isNeeded(importModule) { return importModule[0] !== '.'; }

  massagePrefix(prefix) { return prefix; }

  getList(importModule, filePath) {
    const projectPath = this.getProjectPath(filePath);
    return this.parseModule(importModule, {basedir: projectPath})
      .then(results => {
        if (results.length > 0) {
          return results.map(entry => entry.name);
        }
        const nodeModulePath = this.path.normalize(`${projectPath}/node_modules/${importModule}`);
        const mainfile = this.getMainFileName(nodeModulePath);
        return this.lookupCommonJs(mainfile, nodeModulePath);
      })
      .then((suggestions) => suggestions.map((exportname) => ({
        text: exportname,
        displayText: exportname,
        type: 'property'
      })));
  }

  getMainFileName(nodeModulePath) {
    let mainFile;
    try {
      const content = this.readFileSync(this.path.resolve(nodeModulePath, 'package.json'), {encoding: 'utf8'});
      mainFile = JSON.parse(content).main || 'index';
    }
    catch(_e) {
      // if failed it must not a package root but a file.
      return this.path.resolve(`${nodeModulePath}.js`);
    }
    return `${mainFile.substring(0, mainFile.lastIndexOf('.'))}.js`;
  }
}

module.exports = GlobalLookup;

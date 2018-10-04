class LocalLookup {
  constructor(readdirAsync, getModuleDir, removeExtension, extractPrefixFrom) {
    this.readdir = readdirAsync;
    this.getModuleDir = getModuleDir;
    this.removeExtension = removeExtension;
    this.extractPrefixFrom = extractPrefixFrom;
  }

  isNeeded(prefix) { return prefix[0] === '.'; }

  getList(prefix, filePath, configs = { includeExtension: false }) {
    if (!filePath) { return Promise.resolve([]); }
    return this.lookup(prefix, filePath, configs.includeExtension);
  }

  massagePrefix(prefix) { return this.extractPrefixFrom(prefix); }

  lookup(prefix, filePath, includeExtension) {
    const lookupDirname = this.getModuleDir(prefix, filePath);
    if (!lookupDirname) { return Promise.resolve([]); }
    return this.readdir(lookupDirname)
    .filter(filename => filename[0] !== '.')
    .map(pathname => ({
      text: includeExtension ? pathname : this.removeExtension(pathname),
      displayText: pathname,
      type: 'import'
    }))
    .catch(e => {
        console.error([{
          scope: 'module-local',
          prefix: prefix,
          additional: [`filePath=${filePath}`]
        }, e.stack || e]); /* eslint no-console: "off" */
        return [];
      });
  }
}

module.exports = LocalLookup;

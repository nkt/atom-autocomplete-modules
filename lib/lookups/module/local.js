class LocalLookup {
  constructor(readdirAsync, getModuleDir, removeExtension) {
    this.readdir = readdirAsync;
    this.getModuleDir = getModuleDir;
    this.removeExtension = removeExtension;
  }

  isNeeded(prefix) { return prefix[0] === '.'; }

  getList(prefix, filePath, configs = { includeExtension: false }) {
    return this.lookup(prefix, filePath, configs.includeExtension);
  }

  lookup(prefix, filePath, includeExtension) {
    const lookupDirname = this.getModuleDir(prefix, filePath);
    return this.readdir(lookupDirname)
    .catch((e) => {
      if (e.code !== 'ENOENT') { throw e; }
      return [];
    })
    .filter(filename => filename[0] !== '.')
    .map(pathname => ({
      text: includeExtension ? pathname : this.removeExtension(pathname),
      displayText: pathname,
      type: 'import'
    }));
  }
}

module.exports = LocalLookup;

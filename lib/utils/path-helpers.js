module.exports = {
  getProjectPath: (activePanePath) => {
    const [projectPath] = atom.project.relativizePath(activePanePath);
    return projectPath;
  },
  getModuleDir: (moduleName, filePath) => {
    const filterPrefix = moduleName.endsWith('/') ? ''
      : moduleName.replace(path.dirname(moduleName), '').replace('/', '');

    const dirname = path.dirname(filePath);
    let lookupDirname = path.resolve(dirname, moduleName);
    if (filterPrefix) {
      lookupDirname = lookupDirname.replace(new RegExp(`${escapeRegExp(filterPrefix)}$`), '');
    }

    return lookupDirname;
  },
  removeExtension: (filename) => {
    return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
  }
}

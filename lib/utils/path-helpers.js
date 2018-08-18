const path = require('path');
const { lstatSync } = require('fs');
const Promise = require('bluebird');
const promisedReaddir = Promise.promisify(require('fs').readdir);

const escapeRegExp = require('lodash.escaperegexp');

const extensions = 'js|es6|jsx|coffee|ts|tsx';

module.exports = {
  extensions: extensions.split('|'),
  getProjectPath: (activePaneFullPath) => {
    const [projectPath] = atom.project.relativizePath(activePaneFullPath);
    return projectPath;
  },
  getModuleDir: (moduleName, filePath) => {
    const filterPrefix = moduleName.endsWith('/') ? ''
      : moduleName.replace(path.dirname(moduleName), '').replace('/', '');

    const dirname = lstatSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
    let lookupDirname = path.resolve(dirname, moduleName);
    if (filterPrefix) {
      lookupDirname = lookupDirname.replace(new RegExp(`${escapeRegExp(filterPrefix)}$`), '');
    }

    return lookupDirname;
  },
  removeExtension: (filename) => {
    const extRegex = new RegExp(`(\\.(?:${extensions}))$`);
    return filename.replace(extRegex, '');
  },

  resolveFileFullPath: (file, baseDir) => {
    const fileDir = path.dirname(path.resolve(baseDir, file));

    return promisedReaddir(fileDir)
    .then(files => {
      const fileName = path.basename(file);
      const searchedFile = files.find(n => n === fileName);
      if (!searchedFile) { throw new Error('could not find file', file); }
      return path.resolve(fileDir, searchedFile);
    });
  }
}

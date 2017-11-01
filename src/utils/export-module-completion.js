const ES6_IMPORT_FROM_REGEX = /import\s+.*\s+from\s+['"](.*)['"]/;
const CJS_IMPORT_FROM_REGEX = /require\(['"](.*)['"]\)/;

const path = require('path');
const fs = require('fs');
const PATH_SLASH = process.platform === 'win32' ? '\\' : '/';

const escapeRegExp = require('lodash.escaperegexp');
const { parseModule, parseFile } = require('esm-exports');

const getRealExportPrefix = (prefix, line) => {
  try {
    const es6ExportPrefixRegex = new RegExp(`(?:import\\s+{|import)\\s+((?:.+?)*${escapeRegExp(prefix)})`);
    const cjsExportPrefixRegex = new RegExp(`(?:var|const|let)\\s+\\{((?:.+?)*${escapeRegExp(prefix)})`, 'i');
    const exportMatch = es6ExportPrefixRegex.exec(line) || cjsExportPrefixRegex.exec(line);
    if (!exportMatch) {
      return false;
    }
    const exportPrefix = exportMatch[1];
    return exportPrefix.substring(exportPrefix.lastIndexOf(',') + 1).trim();
  } catch (e) {
    return false;
  }
}

const getImportModule = (textRow) => {
  try {
    let importMatch = ES6_IMPORT_FROM_REGEX.exec(textRow) || CJS_IMPORT_FROM_REGEX.exec(textRow);
    if (!importMatch) {
      return false;
    }
    return importMatch[1];
  } catch (e) {
    return false;
  }
}

const getExports = (activePanePath, prefix, importModule) => {
  return importModule[0] !== '.' ?
      lookupGlobal(importModule, activePanePath) :
      lookupLocal(importModule, activePanePath);
};

const lookupGlobal = (importModule, activePanePath) => {
  const projectPath = getProjectPath(activePanePath);
  return parseModule(importModule, {dirname: projectPath})
    .then(results => {
      if (results.length > 0) {
        return results.map(entry => entry.name);
      }
      const nodeModulePath = path.normalize(`${projectPath}/node_modules/${importModule}`);
      const mainfile = getMainFileName(nodeModulePath);
      return lookupCommonJs(mainfile, nodeModulePath);
    });
};

const getMainFileName = (nodeModulePath) => {
  const content = fs.readFileSync(path.resolve(nodeModulePath, 'package.json'), {encoding: 'utf8'});
  const mainFile = JSON.parse(content).main || 'index';
  return mainFile.substring(0, mainFile.lastIndexOf('.'));
};

const getProjectPath = (activePanePath) => {
  const [projectPath] = atom.project.relativizePath(activePanePath);
  return projectPath;
}

const lookupLocal  = (importModule, activePanePath) => {
  const filePath = activePanePath.substring(0, activePanePath.lastIndexOf(PATH_SLASH));
  return parseFile(importModule, {dirname: filePath})
    .then(results => results.length > 0 ?
      results.map(entry => entry.name) :
      lookupCommonJs(importModule, filePath))
    .catch(() => {
      return lookupCommonJs(importModule, filePath);
    });
};

const lookupCommonJs = (importModule, projectPath) => {
  const absoluteFile = path.resolve(projectPath, `${importModule}.js`);
  return Object.keys(require(path.normalize(absoluteFile)));
}

module.exports = {
  getRealExportPrefix,
  getImportModule,
  getExports
};

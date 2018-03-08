const ES6_IMPORT_FROM_REGEX = /import\s+.*\s+from\s+['"](.*)['"]/;
const CJS_IMPORT_FROM_REGEX = /require\(['"](.*)['"]\)/;

const path = require('path');
const fs = require('fs');
const PATH_SLASH = process.platform === 'win32' ? '\\' : '/';

const escapeRegExp = require('lodash.escaperegexp');
const { module: parseModule, file: parseFile } = require('esm-exports');

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
  return parseModule(importModule, {basedir: projectPath})
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
  let mainFile;
  try {
    const content = fs.readFileSync(path.resolve(nodeModulePath, 'package.json'), {encoding: 'utf8'});
    mainFile = JSON.parse(content).main || 'index';
  }
  catch(_e) {
    // if failed it must not a package root but a file.
    return path.resolve(`${nodeModulePath}.js`);
  }
  return `${mainFile.substring(0, mainFile.lastIndexOf('.'))}.js`;
};

const getProjectPath = (activePanePath) => {
  const [projectPath] = atom.project.relativizePath(activePanePath);
  return projectPath;
}

const lookupLocal  = (importModule, activePanePath) => {
  const filePath = activePanePath.substring(0, activePanePath.lastIndexOf(PATH_SLASH));
  return parseFile(importModule, {basedir: filePath})
    .then(results => results.length > 0 ?
      results.map(entry => entry.name) :
      lookupCommonJs(`${importModule}.js`, filePath))
    .catch(() => {
      return lookupCommonJs(`${importModule}.js`, filePath);
    });
};

const lookupCommonJs = (importFile, projectPath) => {
  const absoluteFile = path.resolve(projectPath, importFile);
  const importedObj = require(path.normalize(absoluteFile));
  return (typeof importedObj === "object") ? Object.keys(importedObj)
    : (typeof importedObj === "function") ? [importedObj.name] : [importedObj];
}

module.exports = {
  getRealExportPrefix,
  getImportModule,
  getExports
};

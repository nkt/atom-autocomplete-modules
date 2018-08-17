const path = require('path');

module.exports = function lookupCommonjs(importFile, projectPath) {
  const absoluteFile = path.resolve(projectPath, importFile);
  const importedObj = require(path.normalize(absoluteFile));
  return (typeof importedObj === "object") ? Object.keys(importedObj)
    : (typeof importedObj === "function") ? [importedObj.name] : [importedObj];
};

const { regexOnCjsExport, regexOnEs6Export } = require('./regex-patterns');

module.exports = function getRealExportPrefix(prefix, line) {
  try {
    const exportMatch = regexOnEs6Export(prefix).exec(line) || regexOnCjsExport(prefix).exec(line);
    if (!exportMatch) {
      return false;
    }
    const exportPrefix = exportMatch[1];
    return exportPrefix.substring(exportPrefix.lastIndexOf(',') + 1).trim();
  } catch (e) {
    return false;
  }
}

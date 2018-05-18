module.exports = function getRealExportPrefix(prefix, line) {
  try {
    const { regexOnCjsExport, regexOnEs6Export }= require('./regex.patterns');
    const exportMatch = regexOnEs6Export.exec(line) || regexOnCjsExport.exec(line);
    if (!exportMatch) {
      return false;
    }
    const exportPrefix = exportMatch[1];
    return exportPrefix.substring(exportPrefix.lastIndexOf(',') + 1).trim();
  } catch (e) {
    return false;
  }
}

const { regexOnCjsModule, regexOnEs6Module } = require('./regex-patterns');

module.exports = function getRealImportPrefix(prefix, line) {
  try {
    const realPrefixMatches = regexOnCjsModule(prefix).exec(line) || regexOnEs6Module(prefix).exec(line);
    if (!realPrefixMatches) {
      return false;
    }

    return realPrefixMatches[1];
  } catch (e) {
    return false;
  }
};

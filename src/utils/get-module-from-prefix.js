module.exports = function getRealImportPrefix(prefix, line) {
  try {
    const { cjsRealPrefixRegExp, es6RealPrefixRegExp }= require('./regex.patterns');
    const realPrefixMatches = cjsRealPrefixRegExp(prefix).exec(line) || es6RealPrefixRegExp(prefix).exec(line);
    if (!realPrefixMatches) {
      return false;
    }

    return realPrefixMatches[1];
  } catch (e) {
    return false;
  }
};

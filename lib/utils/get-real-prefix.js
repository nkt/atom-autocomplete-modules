'use babel';

const escapeRegExp = require('lodash.escaperegexp');

// NOTE: documentation
module.exports = function getRealPrefix(prefix, line) {
  try {
    const realPrefixRegExp = new RegExp(`['"]((?:.+?)*${escapeRegExp(prefix)})`);
    const realPrefixMathes = realPrefixRegExp.exec(line);
    if (!realPrefixMathes) {
      return false;
    }

    return realPrefixMathes[1];
  } catch (e) {
    return false;
  }
};

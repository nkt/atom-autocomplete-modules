'use babel';

/**
 * Normalize filename by stripping extensions
 * @example 'someFile.js' => 'someFile'
 * @param  {string} filename
 * @return {string}
 */
module.exports = function normalizeLocal(filename) {
  return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
};

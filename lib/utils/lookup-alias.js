const Promise = require('bluebird');
const path = require('path');

/**
 * @typedef {Object} AliasLookup
 * @property {String} prefixWithoutAlias - The actual prefix to look for
 * @property {String} pathToAlias - directory path to search for the prefix
 */

/**
 * Provides information to the path for given aliases
 * @method lookupAliases
 * @param  {String}      prefix       Prefix at the cursor
 * @param  {String}      projectPath  Full path to the project root
 * @param  {Array}       [aliases=[]] List of {expose: aliaseName, src: path from root}
 * @return {Promise}                  List of AliasLookup
 * @throws {false}                    Throws false when error occurred (no results)
 */
module.exports = function lookupAliases(prefix, projectPath, aliases = []) {
  // determine the right prefix for the alias config
  // `realPrefix` is the prefix we want to use to find the right file/suggestions
  // when the prefix is a sub module (eg. module/subfile),
  // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
  const prefixSplit = prefix.split('/');
  const modulePrefix = prefixSplit[0];
  const realPrefix = prefixSplit.pop();
  const moduleSearchPath = prefixSplit.join('/');

  if (!aliases || aliases.length === 0) {
    return Promise.reject(false);
  }

  return Promise.resolve(aliases
    .filter(alias => alias.expose.startsWith(modulePrefix))
    .map((alias) => {
      // The search path is the source directory specified in .babelrc
      // then we append the `moduleSearchPath` (without the alias)
      // to get the real search path
      const searchPath = path.join(
        path.resolve(projectPath, alias.src),
        moduleSearchPath.replace(alias.expose, '')
      );
      return {prefixWithoutAlias: realPrefix, pathToAlias: searchPath};
    }));
}

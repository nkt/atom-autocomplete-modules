const Promise = require('bluebird');
const path = require('path');

module.exports = function lookupAliases(prefix, projectPath, aliases = []) {
  // determine the right prefix for the alias config
  // `realPrefix` is the prefix we want to use to find the right file/suggestions
  // when the prefix is a sub module (eg. module/subfile),
  // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
  const prefixSplit = prefix.split('/');
  const modulePrefix = prefixSplit[0];
  const realPrefix = prefixSplit.pop();
  const moduleSearchPath = prefixSplit.join('/');

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

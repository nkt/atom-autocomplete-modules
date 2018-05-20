module.exports = function lookupAliases(prefix, projectPath, aliases = {}) {
  // determine the right prefix for the alias config
  // `realPrefix` is the prefix we want to use to find the right file/suggestions
  // when the prefix is a sub module (eg. module/subfile),
  // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
  const prefixSplit = prefix.split('/');
  const modulePrefix = prefixSplit[0];
  const realPrefix = prefixSplit.pop();
  const moduleSearchPath = prefixSplit.join('/');

  return Promise.all(aliases
    .filter(alias => alias.expose.startsWith(modulePrefix))
    .map(
    (alias) => {
      // The search path is the source directory specified in .babelrc
      // then we append the `moduleSearchPath` (without the alias)
      // to get the real search path
      const searchPath = path.join(
        path.resolve(projectPath, alias.src),
        moduleSearchPath.replace(alias.expose, '')
      );

      return this.lookupLocal(realPrefix, searchPath);
    }
  )).then(
    (suggestions) => [].concat(...suggestions)
  ).then(suggestions => {
    // make sure the suggestions are from the compatible alias
    if (prefix === realPrefix && aliases.length) {
      return suggestions.filter(sugg =>
        aliases.find(a => a.expose === sugg.text)
      );
    }
    return suggestions;
  });
}

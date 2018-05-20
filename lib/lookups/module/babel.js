const Promise = require('bluebird');

class BabelLookup {
  constructor(getProjectPath, path, findBabelConfig, localLookup) {
    this.getProjectPath = getProjectPath;
    this.path = path;
    this.findBabelConfig = findBabelConfig;
    this.local = localLookup;
  }

  isNeeded(_prefix, configs) { return configs.babelPluginModuleResolver === true; }

  getList(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);

    if (!projectPath) return;

    const suggestionsTotal = [];
    let currentPath = this.path.dirname(activePanePath);

    while (currentPath.startsWith(projectPath)) {
      const currentSuggestions = this.findBabelConfig(currentPath).then(({config}) => {
        if (config && Array.isArray(config.plugins)) {
          // Grab the v1 (module-alias) or v2 (module-resolver) plugin configuration
          const pluginConfig = config.plugins.find(p => p[0] === 'module-alias' || p[0] === 'babel-plugin-module-alias') ||
            config.plugins.find(p => p[0] === 'module-resolver' || p[0] === 'babel-plugin-module-resolver');
          if (!pluginConfig) {
            return [];
          }

          // Only v2 of the plugin supports custom root directories
          let rootPromises = [];
          if (!Array.isArray(pluginConfig[1])) {
            const rootDirs = pluginConfig[1].root || [];
            rootPromises = rootPromises.concat(rootDirs.map(r => {
              const rootDirPath = this.path.join(projectPath, r);
              return this.local.lookup(`./${prefix}`, rootDirPath);
            }));
          }

          // determine the right prefix for the alias config
          // `realPrefix` is the prefix we want to use to find the right file/suggestions
          // when the prefix is a sub module (eg. module/subfile),
          // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
          const prefixSplit = prefix.split('/');
          const modulePrefix = prefixSplit[0];
          const realPrefix = prefixSplit.pop();
          const moduleSearchPath = prefixSplit.join('/');

          // get the alias configs for the specific module
          const aliasConfig = Array.isArray(pluginConfig[1])
            // v1 of the plugin is an array
            ? pluginConfig[1].filter(alias => alias.expose.startsWith(modulePrefix))
            // otherwise it's v2 (an object)
            : Object.keys(pluginConfig[1].alias || {})
              .filter(expose => expose.startsWith(modulePrefix))
              .map(exp => ({
                expose: exp,
                src: pluginConfig[1].alias[exp]
              }));

          return Promise.all(rootPromises.concat(aliasConfig.map(
            (alias) => {
              // The search tpath is the source directory specified in .babelrc
              // then we append the `moduleSearchPath` (without the alias)
              // to get the real search path
              const searchPath = this.path.join(
                this.path.resolve(projectPath, alias.src),
                moduleSearchPath.replace(alias.expose, '')
              );

              return this.local.lookup(realPrefix, searchPath);
            }
          ))).then(
            (suggestions) => [].concat(...suggestions)
          ).then(suggestions => {
            // make sure the suggestions are from the compatible alias
            if (prefix === realPrefix && aliasConfig.length) {
              return suggestions.filter(sugg =>
                aliasConfig.find(a => a.expose === sugg.text)
              );
            }
            return suggestions;
          });
        }

        return [];
      });

      suggestionsTotal.push(currentSuggestions);
      currentPath = this.path.resolve(currentPath, '../');
    }

    return Promise
      .all(suggestionsTotal)
      .then(list => list.reduce((acc, suggestions) => acc.concat(suggestions), []));
  }
}

module.exports = BabelLookup;

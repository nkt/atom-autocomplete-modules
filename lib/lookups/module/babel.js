  const Promise = require('bluebird');

class BabelLookup {
  constructor(getProjectPath, path, findBabelConfig, localLookup, lookupAlias) {
    this.getProjectPath = getProjectPath;
    this.path = path;
    this.findBabelConfig = Promise.method(findBabelConfig);
    this.local = localLookup;
    this.lookupAlias = lookupAlias;
  }

  isNeeded(_prefix, configs) { return configs.babelPluginModuleResolver === true; }

  getList(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);

    if (!projectPath) return Promise.resolve();

    const suggestionsTotal = [];
    let currentPath = this.path.dirname(activePanePath);
    let pluginConfig = [];
    // TODO: must be a better way to find all nested babelrc.
    while (currentPath.startsWith(projectPath)) {
      const currentSuggestions = this.findBabelConfig(currentPath)
      .then(({config}) => {
        if (!config || (config && !Array.isArray(config.plugins))) return [];

        // Grab the v1 (module-alias) or v2 (module-resolver) plugin configuration
        pluginConfig = this._tryRetrieveV1Aliases(config.plugins)
        || this._retrieveV2Aliases(config.plugins, projectPath);

        // get the alias configs for the specific module
        return this.lookupAlias(prefix, projectPath, pluginConfig);
      })
      .then(aliasLookups =>
        Promise.all(aliasLookups
          .map(({prefixWithoutAlias: realPrefix, pathToAlias: path}) =>
          this.local.lookup(realPrefix, path))))
      .reduce((total, lookup) => [...total, ...lookup], []);

      suggestionsTotal.push(currentSuggestions);
      currentPath = this.path.resolve(currentPath, '../');
    }

    return Promise
      .all(suggestionsTotal)
      .then(list => list.reduce((acc, suggestions) => acc.concat(suggestions), []));
  }

  _tryRetrieveV1Aliases(plugins) {
    const pluginConfig = plugins.find(p => p[0] === 'module-alias' || p[0] === 'babel-plugin-module-alias');
    // return undefined to allow short-circuit try on v2.
    return pluginConfig ? pluginConfig[1] : undefined;
  }

  _retrieveV2Aliases(plugins, originalProjectRootPath) {
    const pluginConfig = plugins.find(p => p[0] === 'module-resolver' || p[0] === 'babel-plugin-module-resolver');
    if (!pluginConfig) { return []; }

    const aliases = Object.keys(pluginConfig[1].alias || {})
      .map(exp => ({ expose: exp, src: pluginConfig[1].alias[exp] }));

    // Only v2 of the plugin supports custom root directories
    let rootLookups = pluginConfig[1].root ?
      pluginConfig[1].root.map(r => ({ expose: `.`, src: this.path.join(originalProjectRootPath, r) }))
      : [];

    return [...aliases, ...rootLookups];
  }
}

module.exports = BabelLookup;

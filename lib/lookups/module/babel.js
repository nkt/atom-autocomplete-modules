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

  massagePrefix(prefix) { return prefix; }

  getList(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);

    if (!projectPath) return Promise.resolve();

    const suggestionsTotal = [];
    let currentPath = this.path.dirname(activePanePath);
    // TODO: must be a better way to find all nested babelrc.
    while (currentPath.startsWith(projectPath)) {
      let currentSuggestions = this._generateSuggestion(currentPath, prefix, projectPath);
      suggestionsTotal.push(currentSuggestions);
      currentPath = this.path.resolve(currentPath, '../');
    }

    return Promise
      .all(suggestionsTotal)
      .then(list => list.reduce((acc, suggestions) => acc.concat(suggestions), []));
  }

  _generateSuggestion(currentPath, prefix, projectPath) {
    return this.findBabelConfig(currentPath)
    .then(({config}) => {
      if (!config || (config && !Array.isArray(config.plugins))) return [];

      // Grab the v2 (module-resolver) or v1 (module-alias) plugin configuration
      let aliasLookup;
      const v2Config = this._retrieveV2Config(config.plugins);
      const v2Aliases = v2Config ? this._retrieveV2Aliases(v2Config) : undefined;

      if (v2Aliases !== undefined) {
        aliasLookup = this.lookupAlias(prefix, projectPath, v2Aliases);
      } else {
        const v1AliasesConfig = this._retrieveV1Aliases(config.plugins);
        aliasLookup = v1AliasesConfig ? this.lookupAlias(prefix, projectPath, v1AliasesConfig) : Promise.resolve();
      }

      aliasLookup = aliasLookup
        .map(({prefixWithoutAlias: realPrefix, pathToAlias: path}) =>
        this.local.lookup(realPrefix, path))
        .then(localLookups => localLookups.reduce((total, lookup) => [...total, ...lookup], []));

      const rootLookup = v2Config ?
        this._rootsLookups(prefix, projectPath, v2Config) : [Promise.resolve([])];

      return Promise.all(rootLookup.concat(aliasLookup));
    })
    .then(localLookups => localLookups.reduce((total, lookup) => [...total, ...lookup], []));
  }

  _retrieveV1Aliases(plugins) {
    const pluginConfig = plugins.find(p => p[0] === 'module-alias' || p[0] === 'babel-plugin-module-alias');
    return pluginConfig ? pluginConfig[1] : undefined;
  }

  _retrieveV2Aliases(pluginConfig) {
    return Object.keys(pluginConfig.alias || {})
      .map(exp => ({ expose: exp, src: pluginConfig.alias[exp] }));
  }

  _rootsLookups(prefix, projectPath, pluginConfig) {
    if (pluginConfig.root && pluginConfig.root.length > 0) {
      return pluginConfig.root.map(rootPath => {
          const realPath = this.path.join(projectPath, rootPath);
          //  set ./ to mimic as though it is relative from the babel root path
          return this.local.lookup(`./${prefix}`, realPath);
      });
    }
    return [Promise.resolve([])];
  }

  _retrieveV2Config(plugins) {
    const pluginConfig = plugins.find(p => p[0] === 'module-resolver' || p[0] === 'babel-plugin-module-resolver');
    return !pluginConfig ? undefined : pluginConfig[1];
  }
}

module.exports = BabelLookup;

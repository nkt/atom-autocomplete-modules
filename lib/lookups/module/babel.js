const Promise = require('bluebird');

class BabelLookup {
  constructor(getProjectPath, extractPrefixFrom, path, findBabelConfig, localLookup, lookupAlias) {
    this.getProjectPath = getProjectPath;
    this.extractPrefixFrom = extractPrefixFrom;
    this.path = path;
    this.findBabelConfig = Promise.method(findBabelConfig);
    this.local = localLookup;
    this.lookupAlias = lookupAlias;
    this.v2Aliases = undefined; //set to instance property for logging purpose
  }

  isNeeded(_prefix, configs) { return configs.babelPluginModuleResolver === true; }

  massagePrefix(prefix) { return this.extractPrefixFrom(prefix); }

  getList(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);

    if (!projectPath) return Promise.resolve([]);

    let currentPath = this.path.dirname(activePanePath);

    // TODO: must be a better way to find all nested babelrc.
    return this._retrieveAllBabelConfig(currentPath, projectPath)
      .then(configs => {
        const suggestions = configs.map(({rootPath, config}) => this._generateSuggestion(prefix, config, rootPath));

        return Promise.all(suggestions);
      })
      .then(list => list.reduce((acc, suggestions) => acc.concat(suggestions), []))
      .catch(e => {
        console.error([{
          scope: 'module-babel',
          prefix: prefix,
          additional: [`v2Alias=${this.v2Aliases || 'na'}`]
        }, e.stack || e]); /* eslint no-console: "off" */
        return [];
      });
  }

  _retrieveAllBabelConfig(currentPath, projectPath, prevConfigPaths=[], configs=[]) {
    return Promise.all([this.findBabelConfig(currentPath), currentPath, prevConfigPaths, configs])
      .then(([babelrcInfo, currentPath, prevConfigPaths, configs]) =>  {
        if (!babelrcInfo || !babelrcInfo.file) { return configs; }
        const { file, config: babelConfig } = babelrcInfo;

        const config = {
          rootPath: this.path.dirname(file),
          config: babelConfig
        };

        if (!currentPath.startsWith(projectPath)) {
          return configs.length > 0 ? configs : config;
        }

        if (!prevConfigPaths.includes(file)) {
          prevConfigPaths = [...prevConfigPaths, file];
          configs = [...configs, config];
        }

        return this._retrieveAllBabelConfig(
          this.path.resolve(currentPath, '../'),
          projectPath,
          prevConfigPaths,
          configs);
      });
  }

  _generateSuggestion(prefix, config, projectPath) {
    return Promise.resolve(config).then(config => {
      if (!config || (config && !Array.isArray(config.plugins))) return [];

      // Grab the v2 (module-resolver) or v1 (module-alias) plugin configuration
      let aliasLookup;
      const v2Config = this._retrieveV2Config(config.plugins);
      this.v2Aliases = v2Config ? this._retrieveV2Aliases(v2Config) : undefined;

      if (this.v2Aliases !== undefined) {
        aliasLookup = this.lookupAlias(prefix, projectPath, this.v2Aliases);
      } else {
        const v1AliasesConfig = this._retrieveV1Aliases(config.plugins);
        if (!v1AliasesConfig) {
          aliasLookup = Promise.reject();
        } else {
          aliasLookup = this.lookupAlias(prefix, projectPath, v1AliasesConfig);
        }
      }

      aliasLookup = aliasLookup
        .map(({prefixWithoutAlias: realPrefix, pathToAlias: path}) =>
        this.local.lookup(realPrefix, path))
        .then(localLookups => localLookups.reduce((total, lookup) => [...total, ...lookup], []))
        .catch(() => []);

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

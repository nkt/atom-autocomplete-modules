const Promise = require('bluebird');

class WebPackLookup {
  constructor(lodashGet, path, lookupLocal, lookupAlias, getProjectPath) {
    this._get = lodashGet;
    this.path = path;
    this.local = lookupLocal;
    this.lookupAlias = lookupAlias;
    this.getProjectPath = getProjectPath;
  }

  isNeeded(_prefix, configs) { return configs.webpack === true; }

  getList(prefix, filePath, configs) {
    const projectPath = this.getProjectPath(activePanePath);
    if (!projectPath) {
      return Promise.resolve([]);
    }

    return this.lookup(prefix, projectPath, configs);
  }

  lookup(prefix, projectPath, configs) {
    const vendors = configs.vendors;
    const webpackConfig = this.fetchWebpackConfig(projectPath, configs);

    // Webpack v2
    const webpackAliases = this._get(webpackConfig, 'resolve.alias', {});
    const webpackV2Lookups = this.lookupAlias(prefix, projectPath, Object.keys(webpackAliases).map(exp => ({
      expose: exp,
      src: webpackAliases[exp]
    })))
    .map(({prefixWithoutAlias: prefix, pathToAlias: path}) => this.local.lookup(prefix, path, configs.includeExtension));

    // Webpack v1
    const webpackModules = this._get(webpackConfig, 'resolve.modules', []);
    const webpackRoot = this._get(webpackConfig, 'resolve.root', '');
    let moduleSearchPaths = this._get(webpackConfig, 'resolve.modulesDirectories', webpackModules);
    moduleSearchPaths = moduleSearchPaths.filter(
      (item) => vendors.indexOf(item) === -1
    );
    const webpackV1Lookups = moduleSearchPaths.concat(webpackRoot)
    .map((searchPath) => this.local.lookup(
        prefix,
        path.isAbsolute(searchPath) ? searchPath : path.join(projectPath, searchPath),
        configs.includeExtension));

    return Promise.all([...webpackV1Lookups, ...webpackV2Lookups])
    .then((suggestions) => [].concat(...suggestions));
  }

  fetchWebpackConfig(rootPath, configs) {
    const webpackConfigFilename = configs.webpackConfigFilename;
    const webpackConfigPath = path.join(rootPath, webpackConfigFilename);

    try {
      return require(webpackConfigPath); // eslint-disable-line
    } catch (error) {
      return {};
    }
  }
}

module.exports = WebPackLookup;

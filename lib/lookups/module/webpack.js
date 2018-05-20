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
    const webpackModules = this._get(webpackConfig, 'resolve.modules', []);
    const webpackAliases = this._get(webpackConfig, 'resolve.alias', {});

    // Webpack v1
    const webpackRoot = this._get(webpackConfig, 'resolve.root', '');
    let moduleSearchPaths = this._get(webpackConfig, 'resolve.modulesDirectories', webpackModules);
    moduleSearchPaths = moduleSearchPaths.filter(
      (item) => vendors.indexOf(item) === -1
    );

    return Promise.all(moduleSearchPaths.concat(webpackRoot).map(
      (searchPath) => this.local.lookup(
        prefix,
        path.isAbsolute(searchPath) ? searchPath : path.join(projectPath, searchPath,
        configs.includeExtension)
      )
    ).concat(
      this.lookupAlias(prefix, projectPath, Object.keys(webpackAliases).map(exp => ({
        expose: exp,
        src: webpackAliases[exp]
      })))
    )).then(
      (suggestions) => [].concat(...suggestions)
    );
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

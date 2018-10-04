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

  massagePrefix(prefix) { return prefix; }

  getList(prefix, filePath, configs) {
    const projectPath = this.getProjectPath(filePath);
    if (!projectPath) {
      return Promise.resolve([]);
    }

    return this.lookup(prefix, projectPath, configs)
    .catch(e => {
        console.error([{
          scope: 'module-webpack',
          prefix: prefix,
          additional: [`configs=${JSON.stringify(configs)}`]
        }, e.stack || e]); /* eslint no-console: "off" */
        return [];
      });
  }

  lookup(prefix, projectPath, configs) {
    const vendors = configs.vendors;
    const webpackConfig = this.fetchWebpackConfig(projectPath, configs);

    const webpackAliases = this._get(webpackConfig, 'resolve.alias', {});
    const webpackAliasesLookup = this.lookupAlias(prefix, projectPath, Object.keys(webpackAliases).map(exp => ({
      expose: exp,
      src: webpackAliases[exp]
    })))
    .then(lookupAliases => lookupAliases.map(({prefixWithoutAlias: prefix, pathToAlias: path}) => this.local.lookup(prefix, path, configs.includeExtension)))
    .then(promises => Promise.all(promises))
    .reduce((acc, result) => [...acc, ...result], [])
    .catch(() => []);

    const webpackModules = this._get(webpackConfig, 'resolve.modules', []);
    let moduleDirPaths = this._get(webpackConfig, 'resolve.modulesDirectories', webpackModules).filter(item => vendors.indexOf(item) === -1);

    const webpackRoot = this._get(webpackConfig, 'resolve.root');
    let webpackPaths = webpackRoot ? moduleDirPaths.concat(webpackRoot) : moduleDirPaths;
    let webpackPathsLookup;
    if (webpackPaths.length > 0) {
      webpackPaths = webpackPaths.map((searchPath) => this.local.lookup(
          prefix,
          this.path.isAbsolute(searchPath) ? searchPath : this.path.join(projectPath, searchPath),
          configs.includeExtension));
      webpackPathsLookup = Promise.all(webpackPaths).reduce((acc, result) => [...acc, ...result], []);
    } else { webpackPathsLookup = Promise.resolve([]); }

    return Promise.all([webpackAliasesLookup, webpackPathsLookup])
    .reduce((previous, current) => [...previous, ...current], []);
  }

  fetchWebpackConfig(rootPath, configs) {
    const webpackConfigFilename = configs.webpackConfigFilename;
    const webpackConfigPath = this.path.join(rootPath, webpackConfigFilename);

    try {
      return require(webpackConfigPath); // eslint-disable-line
    } catch (error) {
      return {};
    }
  }
}

module.exports = WebPackLookup;

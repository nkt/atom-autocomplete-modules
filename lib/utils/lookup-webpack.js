'use babel';

const path = require('path');
const Promise = require('bluebird');
const get = require('lodash.get');

const getProjectPath = require('./get-project-path');
const lookupLocal = require('./lookup-local');

/**
 * Get Webpack v1.* module search paths.
 * Webpack v1.* uses 'modulesDirectories', 'root', 'fallback' to resolve modules.
 * Reference: https://github.com/webpack/docs/wiki/resolving#resolving-a-module-path
 * @param  {Object} webpackConfig
 * @return {Array}
 */
function getWebpackModuleSearchPaths(webpackConfig) {
  return [].concat(
    get(webpackConfig, 'resolve.modulesDirectories', []),
    // NOTE: can resolve.root return a string?
    get(webpackConfig, 'resolve.root', []),
    get(webpackConfig, 'resolve.fallback', [])
  );
}

/**
 * Get Webpack v2.* modules search paths
 * Reference: https://gist.github.com/sokra/27b24881210b56bbaff7#resolving-options
 * @param  {Object} webpackConfig
 * @return {Array}
 */
function getWebpack2ModuleSearchPaths(webpackConfig) {
  return [].concat(
    get(webpackConfig, 'resolve.modules', [])
  );
}

/**
 * Figure out if given Webpack config is used for Webpack v2.*
 *
 * Webpack v2.* uses a 'modules' property that combines 'modulesDirectories',
 * 'root' and 'fallback' from v1.*. As v1.* doesn't use 'modules' we can
 * lookup if the config has a 'modules' property with an array value.
 *
 * @param  {Object}  webpackConfig
 * @return {Boolean}
 */
function isWebpack2(webpackConfig) {
  const modules = get(webpackConfig, 'resolve.modules');
  return Array.isArray(modules);
}

function lookupSuggestions(webpackConfig, prefix) {
  // get module search paths depending on webpack version
  let moduleSearchPaths = isWebpack2(webpackConfig)
    ? getWebpack2ModuleSearchPaths()
    : getWebpackModuleSearchPaths();

  // filter out vendors
  const vendors = atom.config.get('autocomplete-modules.vendors');
  moduleSearchPaths = moduleSearchPaths.filter((item) => vendors.indexOf(item) === -1);

  const promises = moduleSearchPaths.map((searchPath) => lookupLocal(prefix, searchPath));

  return Promise.all(promises)
    .then((suggestions) => [].concat(...suggestions));
}

/**
 * Fetch webpack config
 * Returns an empty object if no webpack config present
 * @param  {string} rootPath
 * @return {Object}
 */
function fetchConfig(rootPath) {
  const webpackConfigFilename = atom.config.get('autocomplete-modules.webpackConfigFilename');
  const webpackConfigPath = path.join(rootPath, webpackConfigFilename);

  try {
    // use require instead of fs.readFile because webpack configs files need to be executed
    return require(webpackConfigPath); // eslint-disable-line
  } catch (error) {
    return {};
  }
}

module.exports = function lookup(prefix) {
  const projectPath = getProjectPath();

  // return empty array if project doesn't exist
  if (!projectPath) {
    return Promise.resolve([]);
  }

  const webpackConfig = fetchConfig(projectPath);

  return lookupSuggestions(webpackConfig, prefix);
};

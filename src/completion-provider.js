'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const fuzzaldrin = require('fuzzaldrin');
const escapeRegExp = require('lodash.escaperegexp');
const get = require('lodash.get');
const findBabelConfig = require('find-babel-config');
const internalModules = require('./utils/internal-modules');
const { getRealExportPrefix, getImportModule, getExports } = require('./utils/export-module-completion');

const LINE_REGEXP = /(?:^|\s)require\(['"]|^import\s.+from\s+["']|^import\s+["']|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/;

const SELECTOR = [
  '.source.js',
  '.source.ts',
  '.source.tsx',
  '.source.coffee'
];
const SELECTOR_DISABLE = [
  '.source.js .comment',
  '.source.js .keyword',
  '.source.ts .comment',
  '.source.ts .keyword',
  '.source.tsx .comment',
  '.source.tsx .keyword'
];

class CompletionProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
  }

  getSuggestions({editor, bufferPosition, prefix}) {
    const line = editor.buffer.lineForRow(bufferPosition.row);
    if (!LINE_REGEXP.test(line)) {
      return [];
    }

    const activePaneFile = atom.workspace.getActivePaneItem().buffer.file;
    // in case user editing unsaved file
    if (!activePaneFile) {
      return [];
    }

    const prefixLine = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const realImportPrefix = this.getRealImportPrefix(prefix, prefixLine);
    if (realImportPrefix !== false) {
      if (realImportPrefix[0] === '.') {
        return this.lookupLocal(realImportPrefix, path.dirname(editor.getPath()));
      }

      const vendors = atom.config.get('autocomplete-modules.vendors');

      const promises = vendors.map(
        (vendor) => this.lookupGlobal(realImportPrefix, activePaneFile.path, vendor)
      );

      const webpack = atom.config.get('autocomplete-modules.webpack');
      if (webpack) {
        promises.push(this.lookupWebpack(realImportPrefix, activePaneFile.path));
      }

      const babelPluginModuleResolver = atom.config.get('autocomplete-modules.babelPluginModuleResolver');
      if (babelPluginModuleResolver) {
        promises.push(this.lookupbabelPluginModuleResolver(realImportPrefix, activePaneFile.path));
      }

      return Promise.all(promises).then(
        (suggestions) => [].concat(...suggestions)
      );
    }

    const realExportPrefix = getRealExportPrefix(prefix, prefixLine);
    if (realExportPrefix !== false) {
      const importModule = getImportModule(line);
      if (importModule === false) {
        return [];
      }

      return getExports(activePaneFile.path, realExportPrefix, importModule)
      .then((suggestions) => suggestions.map((exportname) => (
          {
              text: exportname,
              displayText: exportname,
              type: 'import'
          })))
      .then((suggestions) => this.filterSuggestions(prefix, suggestions));
    }

    return [];
  }

  getRealImportPrefix(prefix, line) {
    try {
      const cjsRealPrefixRegExp = new RegExp(`require\\(['"]((?:.+?)*${escapeRegExp(prefix)})`);
      const es6RealPrefixRegExp = new RegExp(`(?:from|import)\\s+['"]((?:.+?)*${escapeRegExp(prefix)})`);
      const realPrefixMathes = cjsRealPrefixRegExp.exec(line) || es6RealPrefixRegExp.exec(line);
      if (!realPrefixMathes) {
        return false;
      }

      return realPrefixMathes[1];
    } catch (e) {
      return false;
    }
  }

  filterSuggestions(prefix, suggestions) {
    return fuzzaldrin.filter(suggestions, prefix, {
      key: 'text'
    });
  }

  lookupLocal(prefix, dirname) {
    let filterPrefix = prefix.replace(path.dirname(prefix), '').replace('/', '');
    if (prefix[prefix.length - 1] === '/') {
      filterPrefix = '';
    }

    const includeExtension = atom.config.get('autocomplete-modules.includeExtension');
    let lookupDirname = path.resolve(dirname, prefix);
    if (filterPrefix) {
      lookupDirname = lookupDirname.replace(new RegExp(`${escapeRegExp(filterPrefix)}$`), '');
    }

    return readdir(lookupDirname).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return [];
    }).filter(
      (filename) => filename[0] !== '.'
    ).map((pathname) => ({
      text: includeExtension ? pathname : this.normalizeLocal(pathname),
      displayText: pathname,
      type: 'import'
    })).then(
      (suggestions) => this.filterSuggestions(filterPrefix, suggestions)
    );
  }

  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
  }

  getProjectPath(activePanePath) {
    const [projectPath] = atom.project.relativizePath(activePanePath);
    return projectPath;
  }

  lookupGlobal(prefix, activePanePath, vendor = 'node_modules') {
    const projectPath = this.getProjectPath(activePanePath);
    if (!projectPath) {
      return Promise.resolve([]);
    }

    const vendorPath = path.join(projectPath, vendor);
    if (prefix.indexOf('/') !== -1) {
      return this.lookupLocal(`./${prefix}`, vendorPath);
    }

    return readdir(vendorPath).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return [];
    }).then(
      (libs) => [...internalModules, ...libs]
    ).map((lib) => ({
      text: lib,
      replacementPrefix: prefix,
      type: 'import'
    })).then(
      (suggestions) => this.filterSuggestions(prefix, suggestions)
    );
  }

  lookupWebpack(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);
    if (!projectPath) {
      return Promise.resolve([]);
    }

    const vendors = atom.config.get('autocomplete-modules.vendors');
    const webpackConfig = this.fetchWebpackConfig(projectPath);

    // Webpack v2
    const webpackModules = get(webpackConfig, 'resolve.modules', []);
    const webpackAliases = get(webpackConfig, 'resolve.alias', {});

    // Webpack v1
    const webpackRoot = get(webpackConfig, 'resolve.root', '');
    let moduleSearchPaths = get(webpackConfig, 'resolve.modulesDirectories', webpackModules);
    moduleSearchPaths = moduleSearchPaths.filter(
      (item) => vendors.indexOf(item) === -1
    );

    return Promise.all(moduleSearchPaths.concat(webpackRoot).map(
      (searchPath) => this.lookupLocal(
        prefix,
        path.isAbsolute(searchPath) ? searchPath : path.join(projectPath, searchPath)
      )
    ).concat(
      this.lookupAliases(prefix, projectPath, Object.keys(webpackAliases).map(exp => ({
        expose: exp,
        src: webpackAliases[exp]
      })))
    )).then(
      (suggestions) => [].concat(...suggestions)
    );
  }

  lookupAliases(prefix, projectPath, aliases = {}) {
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

  fetchWebpackConfig(rootPath) {
    const webpackConfigFilename = atom.config.get('autocomplete-modules.webpackConfigFilename');
    const webpackConfigPath = path.join(rootPath, webpackConfigFilename);

    try {
      return require(webpackConfigPath); // eslint-disable-line
    } catch (error) {
      return {};
    }
  }

  lookupbabelPluginModuleResolver(prefix, activePanePath) {
    const projectPath = this.getProjectPath(activePanePath);
    if (projectPath) {
      return findBabelConfig(projectPath).then(({config}) => {
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
              const rootDirPath = path.join(projectPath, r);
              return this.lookupLocal(`./${prefix}`, rootDirPath);
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
              // The search path is the source directory specified in .babelrc
              // then we append the `moduleSearchPath` (without the alias)
              // to get the real search path
              const searchPath = path.join(
                path.resolve(projectPath, alias.src),
                moduleSearchPath.replace(alias.expose, '')
              );

              return this.lookupLocal(realPrefix, searchPath);
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
    }
  }
}

module.exports = CompletionProvider;

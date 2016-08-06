'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const fuzzaldrin = require('fuzzaldrin');
const escapeRegExp = require('lodash.escaperegexp');
const get = require('lodash.get');
const findBabelConfig = require('find-babel-config');
const internalModules = require('./internal-modules');

const LINE_REGEXP = /require|import|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/;
const SELECTOR = [
  '.source.js .string.quoted',
  // for babel-language plugin
  '.source.js .punctuation.definition.string.begin',
  '.source.ts .string.quoted',
  '.source.coffee .string.quoted'
];
const SELECTOR_DISABLE = [
  '.source.js .comment',
  '.source.js .keyword',
  '.source.ts .comment',
  '.source.ts .keyword'
];

class CompletionProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
  }

  getSuggestions({editor, bufferPosition, prefix}) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (!LINE_REGEXP.test(line)) {
      return [];
    }

    const realPrefix = this.getRealPrefix(prefix, line);
    if (!realPrefix) {
      return [];
    }

    if (realPrefix[0] === '.') {
      return this.lookupLocal(realPrefix, path.dirname(editor.getPath()));
    }

    const vendors = atom.config.get('autocomplete-modules.vendors');

    const promises = vendors.map(
      (vendor) => this.lookupGlobal(realPrefix, vendor)
    );

    const webpack = atom.config.get('autocomplete-modules.webpack');
    if (webpack) {
      promises.push(this.lookupWebpack(realPrefix));
    }

    const babelPluginModuleAlias = atom.config.get('autocomplete-modules.babelPluginModuleAlias');
    if (babelPluginModuleAlias) {
      promises.push(this.lookupBabelPluginModuleAlias(realPrefix));
    }

    return Promise.all(promises).then(
      (suggestions) => [].concat(...suggestions)
    );
  }

  getRealPrefix(prefix, line) {
    try {
      const realPrefixRegExp = new RegExp(`['"]((?:.+?)*${escapeRegExp(prefix)})`);
      const realPrefixMathes = realPrefixRegExp.exec(line);
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
    if (filterPrefix[filterPrefix.length - 1] === '/') {
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
      type: 'package'
    })).then(
      (suggestions) => this.filterSuggestions(filterPrefix, suggestions)
    );
  }

  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
  }

  lookupGlobal(prefix, vendor = 'node_modules') {
    const projectPath = atom.project.getPaths()[0];
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
      type: 'package'
    })).then(
      (suggestions) => this.filterSuggestions(prefix, suggestions)
    );
  }

  lookupWebpack(prefix) {
    const projectPath = atom.project.getPaths()[0];
    if (!projectPath) {
      return Promise.resolve([]);
    }

    const vendors = atom.config.get('autocomplete-modules.vendors');
    const webpackConfig = this.fetchWebpackConfig(projectPath);

    let moduleSearchPaths = get(webpackConfig, 'resolve.modulesDirectories', []);
    moduleSearchPaths = moduleSearchPaths.filter(
      (item) => vendors.indexOf(item) === -1
    );

    return Promise.all(moduleSearchPaths.map(
      (searchPath) => this.lookupLocal(prefix, searchPath)
    )).then(
      (suggestions) => [].concat(...suggestions)
    );
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

  lookupBabelPluginModuleAlias(prefix) {
    const projectPath = atom.project.getPaths()[0];
    if (projectPath) {
      const c = findBabelConfig(projectPath);
      if (c && c.config && Array.isArray(c.config.plugins)) {
        const pluginConfig = c.config.plugins.find(p => p[0] === 'module-alias');
        if (!pluginConfig) {
          return Promise.resolve([]);
        }

        // determine the right prefix
        // `realPrefix` is the prefix we want to use to find the right file/suggestions
        // when the prefix is a sub module (eg. module/subfile),
        // `modulePrefix` will be "module", and `realPrefix` will be "subfile"
        const prefixSplit = prefix.split('/');
        const modulePrefix = prefixSplit[0];
        const realPrefix = prefixSplit.pop();
        const moduleSearchPath = prefixSplit.join('/');

        // get the alias configs for the specific module
        const aliasesConfig = pluginConfig[1].filter(alias => alias.expose.startsWith(modulePrefix));

        return Promise.all(aliasesConfig.map(
          (alias) => {
            // The search path is the parent directory of the source directory specified in .babelrc
            // then we append the `moduleSearchPath` to get the real search path
            const searchPath = path.join(
              path.dirname(path.resolve(projectPath, alias.src)),
              moduleSearchPath
            );

            return this.lookupLocal(realPrefix, searchPath);
          }
        )).then(
          (suggestions) => [].concat(...suggestions)
        ).then(suggestions => {
          if (prefix === realPrefix) {
            // make sure the suggestions are from the compatible aliases
            return suggestions.filter(sugg =>
              aliasesConfig.find(a => a.expose === sugg.text)
            );
          }
          return suggestions;
        });
      }
    }

    return Promise.resolve([]);
  }
}

module.exports = CompletionProvider;

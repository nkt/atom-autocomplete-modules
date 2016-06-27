'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const fuzzaldrin = require('fuzzaldrin');
const escapeRegExp = require('lodash.escaperegexp');
const internalModules = require('./internal-modules');

const {getProjectPath, lookupLocal} = require('./helpers');
const lookupWebpack = require('./webpack-lookup');

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
      return lookupLocal(realPrefix, path.dirname(editor.getPath()));
    }

    // add vendor paths paths
    const vendors = atom.config.get('autocomplete-modules.vendors');
    const promises = vendors.map((vendor) => this.lookupGlobal(realPrefix, vendor));

    // add webpack resolve paths if needed
    const webpackSupport = atom.config.get('autocomplete-modules.webpack');
    if (webpackSupport) {
      promises.push(lookupWebpack(realPrefix));
    }

    return Promise.all(promises)
      .then((suggestions) => [].concat(...suggestions));
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

  /**
   * Normalize filename by stripping extensions
   *
   * @example 'someFile.js' => 'someFile'
   * @param  {string} filename
   * @return {string}
   */
  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee|ts|tsx)$/, '');
  }

  lookupGlobal(prefix, vendor = 'node_modules') {
    const projectPath = getProjectPath();

    if (!projectPath) {
      return Promise.resolve([]);
    }

    const vendorPath = path.join(projectPath, vendor);
    if (prefix.indexOf('/') !== -1) {
      return lookupLocal(`./${prefix}`, vendorPath);
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
}

module.exports = CompletionProvider;

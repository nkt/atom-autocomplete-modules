'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);
const path = require('path');
const fuzzaldrin = require('fuzzaldrin');
const escapeRegExp = require('lodash.escaperegexp');
const internalModules = require('./internal-modules');

const LINE_REGEXP = /require|import|export\s+(?:\*|{[a-zA-Z0-9_$,\s]+})+\s+from|}\s*from\s*['"]/;

class CompletionProvider {
  constructor() {
    this.selector = '.source.js .string.quoted, .source.coffee .string.quoted';
    this.disableForSelector = '.source.js .comment, source.js .keyword';
    this.inclusionPriority = 1;
  }

  getSuggestions({editor, bufferPosition, prefix}) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (!LINE_REGEXP.test(line)) {
      return [];
    }

    const realPrefixRegExp = new RegExp(`['"]((?:.+?)*${escapeRegExp(prefix)})`);
    try {
      const realPrefixMathes = realPrefixRegExp.exec(line);
      if (!realPrefixMathes) {
        return [];
      }

      const realPrefix = realPrefixMathes[1];

      if (realPrefix[0] === '.') {
        return this.lookupLocal(realPrefix, path.dirname(editor.getPath()));
      }

      const vendors = atom.config.get('autocomplete-modules.vendors');

      const promises = vendors.map(
        (vendor) => this.lookupGlobal(realPrefix, vendor)
      );

      return Promise.all(promises).then(
        (suggestions) => [].concat(...suggestions)
      );
    } catch (e) {
      return [];
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

    const lookupDirname = path.resolve(dirname, prefix).replace(new RegExp(`${filterPrefix}$`), '');

    return readdir(lookupDirname).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return [];
    }).filter(
      (filename) => filename[0] !== '.'
    ).map((pathname) => ({
      text: this.normalizeLocal(pathname),
      displayText: pathname,
      type: 'package'
    })).then(
      (suggestions) => this.filterSuggestions(filterPrefix, suggestions)
    );
  }

  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee)$/, '');
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
}

module.exports = CompletionProvider;

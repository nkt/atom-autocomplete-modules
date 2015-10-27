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

      return this.lookupGlobal(realPrefix);
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

    return readdir(lookupDirname).filter((filename) => {
      return filename[0] !== '.';
    }).map((pathname) => {
      return {
        text: this.normalizeLocal(pathname),
        displayText: pathname,
        type: 'package'
      };
    }).then((suggestions) => {
      return this.filterSuggestions(filterPrefix, suggestions);
    }).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    });
  }

  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee)$/, '');
  }

  lookupGlobal(prefix) {
    const projectPath = atom.project.getPaths()[0];
    if (!projectPath) {
      return [];
    }

    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (prefix.indexOf('/') !== -1) {
      return this.lookupLocal(`./${prefix}`, nodeModulesPath);
    }

    return readdir(nodeModulesPath).then((libs) => {
      return libs.concat(internalModules);
    }).map((lib) => {
      return {
        text: lib,
        type: 'package'
      };
    }).then((suggestions) => {
      return this.filterSuggestions(prefix, suggestions);
    }).catch((e) => {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    });
  }
}

module.exports = CompletionProvider;

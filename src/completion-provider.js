'use babel';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fuzzaldrin = require('fuzzaldrin');
const internalModules = require('./internal-modules');

class CompletionProvider {
  constructor() {
    this.selector = '.source.js .string.quoted, .source.coffee .string.quoted';
    this.disableForSelector = '.source.js .comment, source.js .keyword';
    this.inclusionPriority = 1;
  }

  getSuggestions({editor, bufferPosition, prefix}) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (!/require|import/.test(line)) {
      return [];
    }

    const realPrefixRegExp = new RegExp(`['"]((?:.+?)*${prefix})`);
    const realPrefixMathes = realPrefixRegExp.exec(line);
    if (!realPrefixMathes) {
      return [];
    }

    const realPrefix = realPrefixMathes[1];

    if (realPrefix[0] === '.') {
      return this.lookupLocal(realPrefix, editor.getPath());
    }

    return this.lookupGlobal(realPrefix);
  }

  lookupLocal(prefix, filename) {
    const prefixDirname = path.dirname(prefix);
    const filePrefix = prefix.replace(prefixDirname, '').replace('/', '');
    const lookupDirname = path.resolve(path.dirname(filename), prefixDirname);

    return fs.readdirAsync(lookupDirname).map((pathname) => {
      return {
        text: this.normalizeLocal(pathname),
        type: 'package'
      };
    }).then((suggestions) => {
      return this.filterSuggestions(filePrefix, suggestions);
    });
  }

  normalizeLocal(filename) {
    return filename.replace(/\.(js|es6|jsx|coffee)$/, '');
  }

  lookupGlobal(prefix) {
    const projectPath = atom.project.getPath();
    if (!projectPath) {
      return [];
    }

    return fs.readdirAsync(path.join(projectPath, 'node_modules')).filter((dirname) => {
      return dirname[0] !== '.';
    }).then((libs) => {
      return libs.concat(internalModules);
    }).map((lib) => {
      return {
        text: lib,
        type: 'package'
      };
    }).then((suggestions) => {
      return this.filterSuggestions(prefix, suggestions);
    });
  }

  filterSuggestions(prefix, suggestions) {
    return fuzzaldrin.filter(suggestions, prefix, {
      key: 'text',
      maxResults: 5
    });
  }
}

module.exports = CompletionProvider;

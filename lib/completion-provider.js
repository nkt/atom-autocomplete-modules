'use babel';

const Promise = require('bluebird');
const path = require('path');

const lookupLocal = require('./utils/lookup-local');
const lookupGlobal = require('./utils/lookup-global');
const lookupWebpack = require('./utils/lookup-webpack');
const getRealPrefix = require('./utils/get-real-prefix');

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

    const realPrefix = getRealPrefix(prefix, line);
    if (!realPrefix) {
      return [];
    }

    if (realPrefix[0] === '.') {
      return lookupLocal(realPrefix, path.dirname(editor.getPath()));
    }

    // add vendor paths paths
    const vendors = atom.config.get('autocomplete-modules.vendors');
    const promises = vendors.map((vendor) => lookupGlobal(realPrefix, vendor));

    // add webpack resolve paths if needed
    const webpackSupport = atom.config.get('autocomplete-modules.webpack');
    if (webpackSupport) {
      promises.push(lookupWebpack(realPrefix));
    }

    return Promise.all(promises)
      .then((suggestions) => [].concat(...suggestions));
  }
}

module.exports = CompletionProvider;

'use babel';

const Promise = require('bluebird');

const Configs = require('./package-configs').retrieval;
const lookupApi = require('./lookups');

const GetModuleFromPrefix = require('./utils/get-module-from-prefix');
const moduleLookups = require('./lookups/module');

const GetExportFromPrefix = require('./utils/get-exports-from-prefix');
const exportLookups = require('./lookups/export');

const LINE_REGEXP = require('./utils/regex-patterns').moduleExistOnLine;

const SELECTOR = [
  '.source.js',
  'javascript',
  '.source.coffee'
];
const SELECTOR_DISABLE = [
  '.source.js .comment',
  'javascript comment',
  '.source.js .keyword',
  'javascript keyword'
];

class CompletionProvider {
  constructor() {
    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.inclusionPriority = 1;
    this.suggestionPriority = 3;
  }

  getSuggestions({editor, bufferPosition, prefix}) {
    const line = editor.buffer.lineForRow(bufferPosition.row);
    if (!LINE_REGEXP.test(line)) {
      return [];
    }

    const activeTextEditor = atom.workspace.getActiveTextEditor();

    const prefixLine = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    let lookupApi;

    const prefixModule = GetModuleFromPrefix(prefix, prefixLine);
    if (prefixModule !== false) {
      lookupApi = new lookupApi(activeTextEditor.getPath(), moduleLookups, Configs);

      const promises = lookupApi.filterList(prefixModule, prefixModule, prefixModule);

      return Promise.all(promises);
    }

    const prefixExport = GetExportFromPrefix(prefix, prefixLine);
    if (prefixExport !== false) {

      if (importModule === false) {
        return [];
      }

      lookupApi = new lookupApi(activeTextEditor.getPath(), exportLookups, Configs);

      const promises = lookupApi.filterList(importModule, importModule, prefixExport);

      return Promise.all(promises);
    }

    return [];
  }
}

module.exports = CompletionProvider;

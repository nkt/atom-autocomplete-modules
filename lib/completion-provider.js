'use babel';

const Promise = require('bluebird');

const Configs = require('./package-configs').retrieval;
const LookupApi = require('./lookups');

const GetModuleFromPrefix = require('./utils/get-module-from-prefix');
const ModuleLookups = require('./lookups/module');

const GetExportFromPrefix = require('./utils/get-exports-from-prefix');
const ExportLookups = require('./lookups/export');

const { regexModuleExistOnLine: LINE_REGEXP } = require('./utils/regex-patterns');
const FilterLookupsByText = require('./utils/filter-lookups-by-text');

const SELECTOR = [
  '.source.js',
  'javascript',
  '.source.coffee',
  '.source.flow'
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
      lookupApi = new LookupApi(activeTextEditor.getPath(), ModuleLookups, Configs, FilterLookupsByText);

      const promises = lookupApi.filterList(prefixModule, prefixModule, prefixModule);

      return Promise.all(promises)
      .reduce((acc, suggestions) => [...acc, ...suggestions], []);
    }

    const prefixExport = GetExportFromPrefix(prefix, prefixLine);
    if (prefixExport !== false) {
      lookupApi = new LookupApi(activeTextEditor.getPath(), ExportLookups, Configs, FilterLookupsByText);

      const importModule = GetModuleFromPrefix('', line);
      const promises = lookupApi.filterList(importModule, importModule, prefixExport);

      return Promise.all(promises)
      .reduce((acc, suggestions) => [...acc, ...suggestions], []);
    }

    return [];
  }
}

module.exports = CompletionProvider;

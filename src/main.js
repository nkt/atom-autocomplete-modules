'use babel';

const CompletionProvider = require('./completion-provider');

class AutocompleteModulesPlugin {
  activate() {
    this.completionProvider = new CompletionProvider();
  }

  deactivate() {
    delete this.completionProvider;
    this.completionProvider = null;
  }

  getCompletionProvider() {
    return this.completionProvider;
  }
}

module.exports = new AutocompleteModulesPlugin();

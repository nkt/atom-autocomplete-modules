'use babel';

class AutocompleteModulesPlugin {
  constructor() {
    this.config = require('./package-configs').registrar;
    this.completionProvider = null;
  }

  activate() {
    this.completionProvider = new (require('./completion-provider'));
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

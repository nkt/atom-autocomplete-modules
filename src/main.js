'use babel';

const CompletionProvider = require('./completion-provider');

class AutocompleteModulesPlugin {
  constructor() {
    this.config = {
      vendors: {
        type: 'array',
        default: ['node_modules'],
        items: {
          type: 'string'
        }
      }
    };
  }

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

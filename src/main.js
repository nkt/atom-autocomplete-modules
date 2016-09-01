'use babel';

const CompletionProvider = require('./completion-provider');

class AutocompleteModulesPlugin {
  constructor() {
    this.config = {
      includeExtension: {
        order: 1,
        title: 'Include file extension',
        description: "Include the file's extension when filling in the completion.",
        type: 'boolean',
        default: false
      },
      vendors: {
        order: 2,
        title: 'Vendor directories',
        description: 'A list of directories to search for modules relative to the project root.',
        type: 'array',
        default: ['node_modules'],
        items: {
          type: 'string'
        }
      },
      webpack: {
        order: 3,
        title: 'Webpack support',
        description: 'Attempts to use the given webpack configuration file resolution settings to search for modules.',
        type: 'boolean',
        default: false
      },
      webpackConfigFilename: {
        order: 4,
        title: 'Webpack configuration filename',
        description: 'When "Webpack support" is enabled this is the config file used to supply module search paths.',
        type: 'string',
        default: 'webpack.config.js'
      },
      babelPluginModuleResolver: {
        order: 5,
        title: 'Babel Plugin Module Resolver support',
        description: 'Use the <a href="https://github.com/tleunen/babel-plugin-module-resolver">Babel Plugin Module Resolver</a> configuration located in your `.babelrc` or in the babel configuration in `package.json`.',
        type: 'boolean',
        default: false
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

class ConfigRetrieval {
  constructor() {}
  get includeExtension() {
    return atom.config.get('autocomplete-modules.includeExtension');
  }

  get vendors() {
    return atom.config.get('autocomplete-modules.vendors');
  }

  get webpack() {
    return atom.config.get('autocomplete-modules.webpack');
  }

  get webpackConfigFilename() {
    return atom.config.get('autocomplete-modules.webpackConfigFilename');
  }

  get babelPluginModuleResolver() {
    return atom.config.get('autocomplete-modules.babelPluginModuleResolver');
  }
}

module.exports = {
  retrieval: new ConfigRetrieval(),
  registrar: {
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
  }
};

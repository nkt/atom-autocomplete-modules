# Atom autocomplete for modules.

[![Build Status](https://circleci.com/gh/nkt/atom-autocomplete-modules/tree/master.svg?style=shield)](https://circleci.com/gh/nkt/atom-autocomplete-modules/tree/master)
[![Current version](https://img.shields.io/apm/v/autocomplete-modules.svg)](https://atom.io/packages/autocomplete-modules)
[![Downloads](https://img.shields.io/apm/dm/autocomplete-modules.svg)](https://atom.io/packages/autocomplete-modules)

Autocomplete for require/import statements.

![Preview](https://cloud.githubusercontent.com/assets/3505878/7442538/9c1892cc-f11e-11e4-8070-3fa8b79beefc.gif)

## Configuration

**Include file extension:**  Include the file's extension when filling in the completion.

**Vendor directories:** A list of directories to search for modules relative to the project
  root. (*Default:* `node_modules`)

**Webpack support:** Look for webpack configuration file and add the `resolve.modulesDirectories` paths to the module search scope.

**Webpack configuration filename:** Name of the configuration file to look for. (*Default:* `webpack.config.js`)

**Babel Plugin Module Resolver support:** Look for a [Babel Plugin Module Resolver](https://github.com/tleunen/babel-plugin-module-resolver) configuration and use it for the autocomplete suggestions.

**Statements:** A list of statements triggering the autocompletion (require/import/export are preset)

License
-------
[![MIT License](https://img.shields.io/apm/l/autocomplete-modules.svg)](LICENSE)

const { module: parseModule, file: parseFile } = require('esm-exports');
const lookupCommonJs = require('../../utils/lookup-commonjs');
const Path = require('path');
const PH = require('../../utils/path-helpers');
const fs = require('fs');

// DI Lookup Factory
const localLookup = new (require('./local'))(parseFile, lookupCommonJs, PH.resolveFileFullPath);
const globalLookup = new (require('./global'))(parseModule, lookupCommonJs, Path, fs.readFileSync, PH.getProjectPath);

module.exports = [
  localLookup,
  globalLookup
];

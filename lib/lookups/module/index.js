const Promise = require('bluebird');
const Readdir = Promise.promisify(require('fs').readdir);
const _get = require('lodash.get');
const Path = require('path');
const LookupAlias = require('../../utils/lookup-alias');
const PH = require('../../utils/path-helpers');
const findBabelConfig = require('find-babel-config');

// DI Lookup Factory

const localLookup = new (require('./local'))(Readdir, PH.getModuleDir, PH.removeExtension, PH.extractPrefixFrom)
const globalLookup = new (require('./global'))(Readdir, PH.getProjectPath, Path, localLookup);
const webpackLookup = new (require('./webpack'))(_get, Path, localLookup,
  LookupAlias, PH.getProjectPath);
const babelLookup = new (require('./babel'))(PH.getProjectPath, PH.extractPrefixFrom, Path, findBabelConfig, localLookup, LookupAlias);
// END

module.exports = [
  localLookup,
  globalLookup,
  webpackLookup,
  babelLookup
];

const lookupExports = require('../../utils/lookup-exports');
const PH = require('../../utils/path-helpers');

// DI Lookup Factory
const localLookup = new (require('./local'))(lookupExports, PH.resolveFileFullPath);
const globalLookup = new (require('./global'))(lookupExports);

module.exports = [
  localLookup,
  globalLookup
];

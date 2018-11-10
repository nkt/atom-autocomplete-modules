const internalModules = require('../../utils/internal-modules');
const Promise = require('bluebird');
const escapeRegExp = require('lodash.escaperegexp');

class GlobalLookup {
  constructor(readdir, getProjectPath, path, localLookup) {
    this.readdir = readdir;
    this.getProjectPath = getProjectPath;
    this.path = path;
    this.local = localLookup;
  }

  isNeeded(prefix) { return prefix[0] !== '.'; }

  massagePrefix(prefix) { return prefix; }

  getList(prefix, filePath, configs) {
    const vendors = (configs && configs.vendors) || ['node_modules'];
    const includeExtension = (configs && configs.includeExtension) || false;
    const promises = vendors.map(vendor => this.lookup(prefix, filePath, vendor, includeExtension));
    return Promise.all(promises)
    .reduce((total, result) => [...total, ...result], [])
    .catch(e => {
      console.error([{
        scope: 'module-global',
        prefix: prefix,
        additional: [
          `vendors=${configs.vendors.join(',')}`,
          `filePath=${filePath}`]
      }, e.stack || e]); /* eslint no-console: "off" */
      return [];
    });
  }

  lookup(prefix, activePanePath, vendor = 'node_modules', includeExtension) {
    const projectPath = this.getProjectPath(activePanePath);
    if (!projectPath) {
      return Promise.resolve([]);
    }

    const vendorPath = this.path.join(projectPath, vendor);

    if (prefix.indexOf('/') !== -1) {
      return this.local.lookup(`./${prefix}`, vendorPath, includeExtension);
    }

    const regexContainsPrefix = new RegExp(escapeRegExp(`${prefix}`), 'i');

    return this.readdir(vendorPath)
    .catch(e => {
      if (e.code !== 'ENOENT') { throw e; }
      return Promise.resolve([]);
    })
    .then(libs => [...libs, ...internalModules])
    .filter(module => {
      if (!prefix) { return true; }
      return regexContainsPrefix.test(module);
      })
    .map(lib => ({
      text: lib,
      replacementPrefix: prefix,
      type: 'import'
    }));
  }
}

module.exports = GlobalLookup;

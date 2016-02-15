'use babel';

const Promise = require('bluebird');
const readdir = Promise.promisify(require('fs').readdir);

const cache = Object.create(null);

function readdirCached(path) {
  // current time in seconds
  const now = Math.round(Date.now() / 1000);
  const entry = cache[path];
  if (entry) {
    // cache entry lifetime
    // 60 sec for node_modules
    // 5 sec for project files
    const lifetime = path.indexOf('node_modules') === -1 ? 5 : 60;
    if (now - entry.time < lifetime) {
      return Promise.resolve(entry.value);
    }

    delete cache[path];
  }

  return readdir(path).then((value) => {
    if (value.length) {
      cache[path] = {
        value,
        time: now
      };
    }

    return value;
  });
}

module.exports = readdirCached;

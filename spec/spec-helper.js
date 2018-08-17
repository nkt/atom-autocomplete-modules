const path = require('path');
const Promise = require('bluebird');

module.exports = {
  fixturesBasePath: path.resolve( __dirname, './fixtures'),

  getProjectPathStub: function() { return path.resolve( __dirname, './fixtures'); },

  localLookupStub: { lookup: (prefix, path) =>
    Promise.resolve([{text: path, displayText: prefix}])
  },

  async: function(run) {
    return function () {
      var done = false;
      var assertIt = null;
      runs(function() {
        run(function (assertions) { assertIt = assertions; done = true });
      });

      waitsFor(function () { return done }, 'async timeout', 500);

      runs(function() { assertIt(); });
    }
  }
};

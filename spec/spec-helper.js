const path = require('path');

module.exports = {
  fixturesBasePath: path.resolve( __dirname, './fixtures'),

  getProjectPathStub: function(p) { return path.resolve( __dirname, './fixtures'); },

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

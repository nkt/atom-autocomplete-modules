const { getProjectPathStub, fixturesBasePath: base, async, localLookupStub } = require('../spec-helper');
// Use the fixtures folder as your test dummy
const lookupAlias = require('../../lib/utils/lookup-alias');

describe('module lookup: webpack on webpack.config.js',() => {
  let subject, config = { vendors: ['node_modules'], webpackConfigFilename: 'webpack.config.alias.js' };
  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/webpack'))
      (require('lodash.get'), require('path'), localLookupStub, lookupAlias, getProjectPathStub);
  });

  describe('resolve.alias', () => {
    beforeEach(() => { config.webpackConfigFilename = 'webpack.config.alias.js' });

    it('should lookup the alias', async((done) => {
      subject.getList('Inner', `${base}/testbed.js`, config)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
          expect(result[0].text).toBe(`${base}/subfolder/innerFolder`);
        });
      });
    }));
  });

  describe('resolve.modules', () => {
    beforeEach(() => { config.webpackConfigFilename = 'webpack.config.modules.js' });

    it('should lookup the modules on all versions', async((done) => {
      subject.getList('Inner', `${base}/testbed.js`, config)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
        });
      });
    }));

    it('should have higher precedents for modulesDirectories', async((done) => {
      config.webpackConfigFilename = 'webpack.config.modulesdir.js';
      subject.getList('Inner', `${base}/testbed.js`, config)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
          expect(result[0].text).toContain('bower_components');
        });
      });
    }));
  });

});

const { getProjectPathStub, fixturesBasePath: base, async, localLookupStub } = require('../spec-helper');
// Use the fixtures folder as your test dummy
const lookupAlias = require('../../lib/utils/lookup-alias');
const { extractPrefixFrom } = require('../../lib/utils/path-helpers');

describe('module lookup: webpack on webpack.config.js',() => {
  let subject, config = { vendors: ['node_modules'], webpackConfigFilename: 'webpack.config.alias.js' };
  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/webpack'))
      (require('lodash.get'), require('path'), localLookupStub, lookupAlias, getProjectPathStub, extractPrefixFrom);
  });
  
  describe('massage prefix', () => {
    it('should remove relative pathing', () => {
      const resultSingle = subject.massagePrefix('./test');
      expect(resultSingle).toBe('test');

      const resultDouble = subject.massagePrefix('../test');
      expect(resultDouble).toBe('test');
    });

    it('should remove parent directory', () => {
      const result = subject.massagePrefix('./parent/test');
      expect(result).toBe('test');
    });
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

    describe('No alias found (invalid config)', () => {
      beforeEach(() => {
        spyOn(localLookupStub, 'lookup').andReturn(Promise.resolve(false));
      });

      it('should return no results', async((done) => {
        subject.getList('Inner', `${base}/testbed.js`, config)
        .then(result => {
          done(() => {
            expect(result.length).toBe(0);
          });
        });
      }));
    });
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

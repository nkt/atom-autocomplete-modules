const { getProjectPathStub, fixturesBasePath: base, async, localLookupStub } = require('../spec-helper');

// This module is pretty crucial to how babelmodule operates
// Use the fixtures folder as your test dummy
const lookupAlias = require('../../lib/utils/lookup-alias');

describe('module lookup: babel',() => {
  let subject;
  let findBabelConfigMock = jasmine.createSpy('findBabelConfig');

  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/babel'))
      (getProjectPathStub, require('path'),
      findBabelConfigMock, localLookupStub, lookupAlias);
  });

  describe('no config', () => {
    beforeEach(() => {
      // if c === null, the config wasn't found
      findBabelConfigMock.andReturn(Promise.resolve(null));
    });
    it('should not lookup anything', async((done) => {
      subject.getList('someprefix', '/some/path')
      .then(result => {
        done(() => {
          expect(result.length).toBe(0);});
      });
    }));
  });

  describe('v1 - babel-plugin-module-alias', () => {
    beforeEach(() => {
      findBabelConfigMock.andReturn(Promise.resolve({ config: {
        'plugins': [
          ['module-alias', [
            { 'src': './subfolder/innerFolder', 'expose': 'inny' },
            { 'src': './src/fake', 'expose': 'notexist' }
          ]]
        ]}}));
    });

    it('should return aliased suggestions', async((done) => {
      subject.getList('inny/function', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(1);
          expect(results[0].text).toBe(`${base}/subfolder/innerFolder`);
        });
      }).catch(e => { throw new Error(e); });
    }));
  });

  describe('v2 - babel-plugin-module-resolver', () => {
    let v2Config;

    beforeEach(() => {
      v2Config = { config: {
          'plugins': [
            ["module-resolver", {
              "alias": {
                "nonexist": "./src/fake",
                "inny": "./subfolder/innerFolder" }
              }]
          ]}
        };
      findBabelConfigMock.andReturn(Promise.resolve(v2Config));
    });

    it('should return aliased suggestions', async((done) => {
      subject.getList('inny/function', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(1);
          expect(results[0].text).toBe(`${base}/subfolder/innerFolder`);
        });
      }).catch(e => { throw new Error(e); });
    }));

    describe('with custom root directories', () => {
        beforeEach(() => {
          v2Config.config.plugins[1] = {
            "root": ["./subfolder"],
            "alias": {
              "wrong": "./subfolder/innerFolder",
              "inny": "./innerFolder" }
          };
          findBabelConfigMock.andReturn(Promise.resolve(v2Config));
        });

        it('should return aliased suggestions', async((done) => {
          subject.getList('inny/function', `${base}/testbed.js`)
          .then((results) => {
            done(() => {
              expect(results.length).toBe(1);
              expect(results[0].text).toBe(`${base}/subfolder/innerFolder`);
            });
          }).catch(e => { throw new Error(e); });
        }));
    });
  });
});

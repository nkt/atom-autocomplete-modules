const lookupCommonJs = require('../../lib/utils/lookup-commonjs');
const fs = require('fs');
const { getProjectPathStub, fixturesBasePath: base, async } = require('../spec-helper');

describe('export lookup: global',() => {
  let subject;

  beforeEach(() => {
    subject = new (require('../../lib/lookups/export/global'))
      (require('esm-exports').module, lookupCommonJs, require('path'), fs.readFileSync, getProjectPathStub);
  });

  describe('trigger', () => {
    it('should trigger lookup on package import', () => {
      const result = subject.isNeeded('commonjs');
      expect(result).toBe(true);
    });

    it('should not trigger lookup on relative import', () => {
      const result = subject.isNeeded('./commonjs/something');
      expect(result).toBe(false);
    });

    it('should not trigger lookup on relative import', () => {
      const result = subject.isNeeded('../commonjs/something');
      expect(result).toBe(false);
    });
  });

  describe('getList', () => {
    it('should retrieve list of all module\'s ecma exports', async((done) => {
      subject.getList('package', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(3);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should retrieve list of all module\'s commonjs exports', async((done) => {
      subject.getList('commonjs', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
        });
      }).catch(e => { throw new Error(e); });
    }));
  });
});

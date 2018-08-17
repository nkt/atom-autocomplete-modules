const lookupCommonJs = require('../../lib/utils/lookup-commonjs');
const { resolveFileFullPath } = require('../../lib/utils/path-helpers');
const { fixturesBasePath: base, async } = require('../spec-helper');

describe('export lookup: local',() => {
  let subject;

  beforeEach(() => {
    subject = new (require('../../lib/lookups/export/local'))
      (require('esm-exports').file, lookupCommonJs, resolveFileFullPath);
  });

  describe('trigger', () => {
    it('should not trigger lookup on named(package) import', () => {
      const result = subject.isNeeded('commonjs');
      expect(result).toBe(false);
    });

    it('should trigger lookup on relative import', () => {
      const result = subject.isNeeded('./commonjs/something');
      expect(result).toBe(true);
    });

    it('should not trigger lookup on relative import', () => {
      const result = subject.isNeeded('../commonjs/something');
      expect(result).toBe(true);
    });
  });

  describe('getList', () => {
    it('should retrieve list of all module\'s ecma exports', async((done) => {
      subject.getList('./node_modules/package/file2', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(3);
          expect(result.find(r => r.displayText === 'ClassName' )).toBeDefined();
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should retrieve list of all module\'s commonjs exports', async((done) => {
      subject.getList('./subfolder/namedFunction', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
          expect(result.find(r => r.displayText === 'named' )).toBeDefined();
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should not retrive any un-named module\'s exports', async((done) => {
      subject.getList('./subfolder/unamedFunction', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
          expect(result[0].displayText).toBe('');
        });
      }).catch(e => { throw new Error(e); });
    }));
  });
});

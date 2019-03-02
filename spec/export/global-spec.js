const lookupExports = require('../../lib/utils/lookup-exports');
const { fixturesBasePath: base, async } = require('../spec-helper');

// using the atom package's node_module to test... too hard to currently stub the path resolution

describe('export lookup: global',() => {
  let subject;

  beforeEach(() => {
    subject = new (require('../../lib/lookups/export/global'))
      (lookupExports);
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
    it('should retrieve list of all module\'s exports', async((done) => {
      subject.getList('defaultPack', `${base}/testbed.js`)
      .then(result => {
        done(() => {
          expect(result.length).toBe(1);
        });
      }).catch(e => { throw new Error(e); });
    }));
  });
});

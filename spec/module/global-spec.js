const { getProjectPathStub, fixturesBasePath: base, async } = require('../spec-helper');
const internalModules = require('../../lib/utils/internal-modules');
const Promise = require('bluebird');
const Readdir = Promise.promisify(require('fs').readdir);

describe('module lookup: global',() => {
  let subject;
  let localLookupStub = { lookup: (prefix, path) => Promise.resolve([{text: path, displayText: prefix}]) };

  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/global'))
      (Readdir, getProjectPathStub, require('path'), localLookupStub);
  });

  describe('trigger', () => {
    it('should trigger lookup on package import', () => {
      const result = subject.isNeeded('commonjs/something');
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

  describe('lookup', () => {
    describe('direct file', () => {
      beforeEach(() => {
        spyOn(localLookupStub, 'lookup').andCallThrough();
      });
      const testCases = ['commonjs/main', '/commonjs/main'];
      testCases.forEach(tc => {
        it(`should return suggested file for ${tc}`, async((done) => {
          subject.getList(tc, `${base}/testbed.js`)
          .then((results) => {
            done(() => {
              expect(results.length).toBe(1);
              expect(localLookupStub.lookup).toHaveBeenCalledWith(`./${tc}`,
                `${base}/node_modules`, false);
            });
          }).catch(e => { throw new Error(e); });
        }));
      });
    });

    describe('directory', () => {
      it(`should return match from internal modules (${internalModules[4]})`, async((done) => {
        subject.getList(internalModules[4], `${base}/testbed.js`)
        .then((results) => {
          done(() => {
            expect(results.length).toBe(1);
            expect(results.some(s => s.text === internalModules[4])).toBe(true);
          });
        }).catch(e => { throw new Error(e); });
      }));

      it('should return match', async((done) => {
        subject.getList('package', `${base}/testbed.js`)
        .then((results) => {
          done(() => {
            expect(results.length).toBe(1);
            expect(results.some(s => s.text === 'package')).toBe(true);
          });
        }).catch(e => { throw new Error(e); });
      }));

      it('should return match for partial prefix', async((done) => {
        subject.getList('pack', `${base}/testbed.js`)
        .then((results) => {
          done(() => {
            expect(results.length).toBe(1);
            expect(results.some(s => s.text === 'package')).toBe(true);
          });
        }).catch(e => { throw new Error(e); });
      }));

      it('should return all if no prefix', async((done) => {
        subject.getList('', `${base}/testbed.js`)
        .then((results) => {
          done(() => {
            // 3 is the 2 node_modules folder and the symlink
            expect(results.length).toBe(internalModules.length + 3);
            expect(results.some(s => s.text === 'package')).toBe(true);
          });
        }).catch(e => { throw new Error(e); });
      }));
    });
  });
});

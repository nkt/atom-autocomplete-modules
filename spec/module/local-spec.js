const { fixturesBasePath: base, async } = require('../spec-helper');
const Promise = require('bluebird');
const Readdir = Promise.promisify(require('fs').readdir);
const { getModuleDir, removeExtension } = require('../../lib/utils/path-helpers');

describe('module lookup: local',() => {
  let subject;
  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/local'))
      (Readdir, getModuleDir, removeExtension);
  });

  describe('trigger', () => {
    it('should trigger lookup on relative path ./', () => {
      const result = subject.isNeeded('./commonjs/something');
      expect(result).toBe(true);
    });

    it('should trigger lookup on relative path ../', () => {
      const result = subject.isNeeded('../../commonjs/something');
      expect(result).toBe(true);
    });

    it('should not trigger lookup on module aliases', () => {
      const result = subject.isNeeded('commonjs/something');
      expect(result).toBe(false);
    });
  });

  describe('lookup', () => {
    // Using fixture folder as test case
    it('should return list of exports in a folder level', async((done) => {
      subject.getList('./node_modules/package', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(2);
          expect(results.some(r => r.text === 'commonjs')).toBe(true);
          expect(results.some(r => r.text === 'package')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of exports in a relative folder', async((done) => {
      subject.getList('./subfolder/', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(3);
          expect(results.some(r => r.text === 'innerFolder')).toBe(true);
          expect(results.some(r => r.text === 'namedFunction')).toBe(true);
          expect(results.some(r => r.text === 'unamedFunction')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of exports in a relative parent', async((done) => {
      subject.getList('../', `${base}/subfolder/innerFolder/function.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(3);
          expect(results.some(r => r.text === 'innerFolder')).toBe(true);
          expect(results.some(r => r.text === 'namedFunction')).toBe(true);
          expect(results.some(r => r.text === 'unamedFunction')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of exports in a specific', async((done) => {
      subject.getList('./node_modules/package/', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(3);
          expect(results.some(r => r.text === 'file1')).toBe(true);
          expect(results.some(r => r.text === 'file2')).toBe(true);
          expect(results.some(r => r.text === 'file3')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));
  });
});

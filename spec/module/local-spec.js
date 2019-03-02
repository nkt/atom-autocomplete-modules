const { fixturesBasePath: base, async } = require('../spec-helper');
const Promise = require('bluebird');
const Readdir = Promise.promisify(require('fs').readdir);
const { getModuleDir, removeExtension, extractPrefixFrom } = require('../../lib/utils/path-helpers');

describe('module lookup: local',() => {
  let subject;
  beforeEach(() => {
    subject = new (require('../../lib/lookups/module/local'))
      (Readdir, getModuleDir, removeExtension, extractPrefixFrom);
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

  describe('lookup', () => {
    // Using fixture folder as test case
    it('should return list of sibling level files of a folder', async((done) => {
      subject.getList('./node_modules/package', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(3);
          expect(results.some(r => r.text === 'package')).toBe(true);
          expect(results.some(r => r.text === 'symfolder')).toBe(true);
          expect(results.some(r => r.text === 'defaultPack')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of files in a relative folder', async((done) => {
      subject.getList('./subfolder/', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(2);
          expect(results.some(r => r.text === 'innerFolder')).toBe(true);
          expect(results.some(r => r.text === 'namedFunction')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of files if the filePath is a directory', async((done) => {
      subject.getList('./', `${base}/subfolder`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(2);
          expect(results.some(r => r.text === 'innerFolder')).toBe(true);
          expect(results.some(r => r.text === 'namedFunction')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of exports in a relative parent', async((done) => {
      subject.getList('../', `${base}/subfolder/innerFolder/function.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(2);
          expect(results.some(r => r.text === 'innerFolder')).toBe(true);
          expect(results.some(r => r.text === 'namedFunction')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return list of exports in a specific', async((done) => {
      subject.getList('./node_modules/package/', `${base}/testbed.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(4);
          expect(results.some(r => r.text === 'file1')).toBe(true);
          expect(results.some(r => r.text === 'file2')).toBe(true);
          expect(results.some(r => r.text === 'main')).toBe(true);
          expect(results.some(r => r.text === 'package.json')).toBe(true);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return no results if the current file has no path (ie untitled)', async((done) => {
      subject.getList('./node_modules/package/', null)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(0);
        });
      }).catch(e => { throw new Error(e); });
    }));

    it('should return no results if the path does not exist', async((done) => {
      subject.getList('./fake', `${base}/fakeFolder/test.js`)
      .then((results) => {
        done(() => {
          expect(results.length).toBe(0);
        });
      }).catch(e => { throw new Error(e); });
    }));
  });
});

const { fixturesBasePath: basePath } = require('../spec-helper');
const path = require('path');
const subject = require('../../lib/utils/lookup-exports');

describe('lookupExports', () => {
  describe('literal exports',() => {
    it('should return no named exports for exports = ', () => {
      const result = subject('./exports/export-literal', basePath);
      expect(result).toHaveLength(0);
    });
  });

  describe('object exports', () => {
    it('should work on exports = ', () => {
      const result = subject('./exports/exports', basePath);
      const assert = Object.keys(require(path.resolve(basePath, './exports/exports')));

      expect(result).toHaveLength(assert.length);
      assert.forEach(expectedExport => {
        expect(result).toContain(expectedExport);
      });
    });

    it('should work on module.exports = ', () => {
      const result = subject('./subfolder/namedFunction', basePath);
      const assert = Object.keys(require(path.resolve(basePath, './subfolder/namedFunction')));

      expect(result).toHaveLength(assert.length);
      assert.forEach(expectedExport => {
        expect(result).toContain(expectedExport);
      });
    });

    it('should work on module.exports.* = ', () => {
      const result = subject('./exports/module-property', basePath);
      const assert = Object.keys(require(path.resolve(basePath, './exports/module-property')));

      expect(result).toHaveLength(assert.length);
      assert.forEach(expectedExport => {
        expect(result).toContain(expectedExport);
      });
    });
  });

  describe('when there is an export overriding', () => {
    it('should take the last export only', () => {
      const result = subject('./node_modules/package/file1', basePath);
      const expect = require(path.resolve(basePath, './node_modules/package/file1'));

      expect(result).toHaveLength(expect.length);
      Object.keys(expect).forEach(expectedExport => {
        expect(result).toContain(expectedExport);
      });
    })
  });

  it('should not execute code when traversing files', () => {
      subject('./other_modules/something/main', basePath);
      expect(global.outsideTestCase).toBeUndefined();
      expect(global.insideTestCase).toBeUndefined();
  });

  it('should return no results if the file does not exist', () => {
    const result = subject('./noexist/this', `${basePath}/fake`);
    expect(result).toHaveLength(0);
  });
});

const { fixturesBasePath: basePath, async } = require('../spec-helper');
const path = require('path');
const subject = require('../../lib/utils/lookup-exports');

fdescribe('lookupExports', () => {
  describe('literal exports',() => {
    it('should return no named exports for exports = ', async((done) => {

      subject('./exports/export-literal', basePath)
      .then(result => {
        done(() => {
            expect(result).toHaveLength(0);
        });
      });
    }));
  });

  describe('object exports', () => {
    it('should work on exports = ', async((done) => {
      subject('./exports/exports', basePath)
      .then(result => {
        done(() => {
          const assert = Object.keys(require(path.resolve(basePath, './exports/exports')));

          expect(result).toHaveLength(assert.length);
          assert.forEach(expectedExport => {
            expect(result).toContain(expectedExport);
          });
        });
      });
    }));

    it('should work on module.exports = ', async((done) => {
      subject('./subfolder/namedFunction', basePath)
      .then(result => {
        done(() => {
          const assert = Object.keys(require(path.resolve(basePath, './subfolder/namedFunction')));

          expect(result).toHaveLength(assert.length);
          assert.forEach(expectedExport => {
            expect(result).toContain(expectedExport);
          });
        });
      });
    }));

    it('should work on module.exports.* = ', async((done) => {

      subject('./exports/module-property', basePath)
      .then(result => {
        done(() => {
          const assert = Object.keys(require(path.resolve(basePath, './exports/module-property')));

          expect(result).toHaveLength(assert.length);
          assert.forEach(expectedExport => {
            expect(result).toContain(expectedExport);
          });
        });
      });
    }));
  });

  describe('when there is an export overriding', () => {
    it('should take the last export only', async((done) => {

      subject('./node_modules/package/file1', basePath)
      .then(result => {
        done(() => {
          const assert = Object.keys(require(path.resolve(basePath, './node_modules/package/file1')));

          expect(result).toHaveLength(assert.length);
          Object.keys(assert).forEach(expectedExport => {
            expect(result).toContain(expectedExport);
          });
        });
      });
    }));
  });

  it('should not execute code when traversing files', async((done) => {

    subject('./other_modules/something/main', basePath)
    .then(() => {
      done(() => {
        expect(global.outsideTestCase).toBeUndefined();
        expect(global.insideTestCase).toBeUndefined();
      });
    });
  }));

  it('should return no results if the file does not exist', async((done) => {
    subject('./exports/export-literal', basePath)
    .then(result => {
      done(() => {
        expect(result).toHaveLength(0);
      });
    });
  }));
});

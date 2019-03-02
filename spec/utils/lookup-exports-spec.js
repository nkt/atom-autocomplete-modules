const { fixturesBasePath: basePath, async } = require('../spec-helper');
const subject = require('../../lib/utils/lookup-exports');

describe('lookupExports', () => {
  describe('exporting cjs', () => {
    it('should return list of exported property', async((done) => {
      subject('./node_modules/package/file1', basePath)
      .then(result => {
        done(() => {
          expect(result).toHaveLength(3);
        });
      });
    }));
  });

  describe('exporting es6', () => {
    it('should return list of exported property', async((done) => {
      subject('./node_modules/package/file2', basePath)
      .then(result => {
        done(() => {
          expect(result).toHaveLength(3);
        });
      });
    }));
  });

  it('should not execute code when traversing files', async((done) => {
    subject('./other_modules/something/main', basePath)
    .then(() => {
      done(() => {
        expect(global.outsideTestCase).toBeUndefined();
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

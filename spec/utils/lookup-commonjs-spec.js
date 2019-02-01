const { fixturesBasePath: basePath } = require('../spec-helper');
const subject = require('../../lib/utils/lookup-commonjs');

describe('lookupCommonjs', () => {
  describe('should show an empty return value for non-object exports',() => {

  });

  describe('multiple exports', () => {
    it('should list all exports', () => {
      const result = subject('./node_modules/package/file1', basePath);
      expect(result).toHaveLength(4);
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

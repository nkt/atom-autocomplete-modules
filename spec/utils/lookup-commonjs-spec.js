const { fixturesBasePath: basePath } = require('../spec-helper');
const subject = require('../../lib/utils/lookup-commonjs');

describe('lookupCommonjs', () => {
  describe('function export', () => {
    it('should return word unamed for an un-named function', () => {
      const result = subject('./subfolder/unamedFunction', basePath);

      expect(result).toEqual(['']);
    });

    it('should return function\'s name for an named function', () => {
      const result = subject('./subfolder/namedFunction', basePath);

      expect(result).toEqual(['named']);
    });
  });

  describe('object export', () => {
    it('should list all properties in an object', () => {
      const result = subject('./object', basePath);
      expect(result).toEqual(['item', 'item2']);
    });
  });
});

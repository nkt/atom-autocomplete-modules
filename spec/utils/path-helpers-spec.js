const subject = require('../../lib/utils/path-helpers');
const path = require('path');
const { fixturesBasePath: basePath } = require('../spec-helper');

describe('path-helpers', function () {
  describe('getProjectPath', () => {
    it('should get the project path of the active file', () => {
      const inspectedFile = `${basePath}/test.txt`;

      const result = subject.getProjectPath(inspectedFile);

      expect(result).toBe(basePath);
    });
  });

  describe('getModuleDir', () => {
    const testCases = [
      {
        story: '"./" relative',
        filePath: `${basePath}/testbed.js`,
        module: './object',
        assert: `${basePath}/`
      }, {
        story: '"../" relative',
        filePath: `${basePath}/subfolder/innerFolder/function.js}`,
        module: '../namedFunction',
        assert: `${basePath}/subfolder/`
      }, {
        story: '"../../" relative',
        filePath: `${basePath}/subfolder/innerFolder/function.js}`,
        module: '../../object',
        assert: `${basePath}/`
      }
    ]
    testCases.forEach((tc) => {
      it(`should return directory path for ${tc.story} path`, () => {
        const result = subject.getModuleDir(tc.module, tc.filePath);
        expect(result).toBe(tc.assert);
      });
    });
  });

  describe('removeExtension', () => {
    const testCases = [
      { ext: 'js', fileName: 'test.js', assert: 'test' },
      { ext: 'es6', fileName: 'test.es6', assert: 'test' },
      { ext: 'jsx', fileName: 'test.jsx', assert: 'test' },
      { ext: 'coffee', fileName: 'test.coffee', assert: 'test' },
      { ext: 'ts', fileName: 'test.ts', assert: 'test' },
      { ext: 'tsx', fileName: 'test.tsx', assert: 'test' }
    ];
    testCases.forEach((tc) => {
      it(`should remove the extension ${tc.ext} from filename ${tc.fileName}`, () => {
        expect(subject.removeExtension(tc.fileName)).toBe(tc.assert);
      });
    });
  });
});

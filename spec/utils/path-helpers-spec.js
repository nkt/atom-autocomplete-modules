  const subject = require('../../lib/utils/path-helpers');

const { fixturesBasePath: basePath, async } = require('../spec-helper');

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
        filePath: `${basePath}/subfolder/innerFolder/function.js`,
        module: '../namedFunction',
        assert: `${basePath}/subfolder/`
      }, {
        story: '"../../" relative',
        filePath: `${basePath}/subfolder/innerFolder/function.js`,
        module: '../../object',
        assert: `${basePath}/`
      }, {
        story: 'absolute',
        filePath: `${basePath}/subfolder/innerFolder/function.js`,
        module: 'this',
        assert: `${basePath}/subfolder/innerFolder/`
      }, {
        story: 'a directory',
        filePath: `${basePath}/subfolder/innerFolder`,
        module: './',
        assert: `${basePath}/subfolder/innerFolder`
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
      { ext: 'js', fileName: 'testjs.js', assert: 'testjs' },
      { ext: 'js', fileName: 'testjs', assert: 'testjs' },
      { ext: 'es6', fileName: 'test.es6', assert: 'test' },
      { ext: 'jsx', fileName: 'test.jsx', assert: 'test' },
      { ext: 'coffee', fileName: 'test.coffee', assert: 'test' },
      { ext: 'ts', fileName: 'test.ts', assert: 'test' },
      { ext: 'tsx', fileName: 'test.tsx', assert: 'test' }
    ];
    testCases.forEach((tc) => {
      const itRunner = tc.fit || it;
      itRunner(`should remove the extension ${tc.ext} from filename ${tc.fileName}`, () => {
        expect(subject.removeExtension(tc.fileName)).toBe(tc.assert);
      });
    });
  });

  describe('resolveFileFullPath', () => {
    it(`should return file's full path if file exist`, async((done) => {
      subject.resolveFileFullPath('./subfolder/innerFolder/react.tsx', basePath).then((result) => {
        done(() => {
          expect(result).toBe(`${basePath}/subfolder/innerFolder/react.tsx`);
        });
      });
    }));

    it(`should throw an error if file does not exist`, async((done) => {
      subject.resolveFileFullPath('./subfolder/innerFolder/react.js', basePath).then().catch(x => {
          done(() => {
            expect(x).toBeDefined();
          });
      });
    }));
  });
});

const subject = require('../../lib/utils/regex-patterns');

describe('regex-patterns', () => {
  const prefix = 'testprefix';

  describe('regexModuleExistOnLine', () => {
    const testCases = [
      // require
      { text: `require('')`, assert: true },
      { text: `require("ok")`, assert: true },
      { text: 'require(`ok`)', assert: true },
      { text: ` require('');`, assert: true },
      { text: ` require("")`, assert: true },
      { text: `const {  } = require('module');`, assert: true },
      { text: `x=require('./myFile.js')`, assert: true },
      { text: `require `, assert: false },
      { text: `.require('test')`, assert: false },
      // import
      { text: `import defaultExport from "module-name"`, assert: true },
      { text: `import defaultExport from ''`, assert: true },
      { text: `import * as name from "module-name";`, assert: true },
      { text: `import { export } from "module-name";`, assert: true },
      { text: `import { export as alias } from "module-name"`, assert: true },
      { text: `import { export1 , export2 } from "`, assert: true },
      { text: `import { export1 , export2 as alias2 , [...] } from "module`, assert: true },
      { text: `import defaultExport, * as name from "module-name"`, assert: true },
      { text: `import "module-name"`, assert: true },
      // export
      { text: `export * from `, assert: true },
      { text: `export { default } from`, assert: true }
    ];
    testCases.forEach((tc) => {
      it(`should ${tc.assert ? '' : 'not'} match for line "${tc.text}"`, () => {
        const regex = subject.regexModuleExistOnLine;
        expect(regex.test(tc.text)).toBe(tc.assert);
      });
    });
  });

  describe('regexOnCjsModule', () => {
    it('should return module if no prefix',() => {
      const regex = subject.regexOnCjsModule('');
      const result = regex.exec(`const {} = require('this-should-show')`);
      expect(result[1]).toBe('this-should-show');
    });

    const testCases = [
      { text: `require('${prefix}`, assert: `${prefix}` },
      { text: `require(\`${prefix}`, assert: `${prefix}` },
      { text: `require('more/stuff${prefix}')`, assert: `more/stuff${prefix}` },
      { text: `require('../${prefix}')`, assert: `../${prefix}` },
      { text: `require("/more/stuff/${prefix}")`, assert: `/more/stuff/${prefix}` },
      { text: `const t = require("@stuff/${prefix}")`, assert: `@stuff/${prefix}` },
      { text: `require(${prefix})`, assert: null }
    ];

    testCases.forEach((tc) => {
      it(`should have result of ${tc.assert} for line "${tc.text}"`, () => {
        const regex = subject.regexOnCjsModule(prefix);
        const result = regex.exec(tc.text);
        if (tc.assert === null) {
          expect(result).toBe(tc.assert);
        } else {
          expect(result[1]).toBe(tc.assert);
        }
      });
    });
  });

  describe('regexOnEs6Module', () => {
    it('should return module if no prefix',() => {
      const regex = subject.regexOnEs6Module('');
      const result = regex.exec(`import {} from '../this-should-show'`);
      expect(result[1]).toBe('../this-should-show');
    });

    const testCases = [
      { text: `from "${prefix}"`, assert: `${prefix}` },
      { text: `from './test-${prefix}`, assert: `./test-${prefix}` },
      { text: `from    "${prefix}ttttt"`, assert: `${prefix}` },
      { text: `from "../t${prefix}"`, assert: `../t${prefix}` },
      { text: `import '/tast/tse/${prefix}")`, assert: `/tast/tse/${prefix}` },
      { text: `import(${prefix})`, assert: null },
      { text: `import('${prefix}`, assert: null }
    ];

    testCases.forEach((tc) => {
      it(`should have result of ${tc.assert} for line "${tc.text}"`, () => {
        const regex = subject.regexOnEs6Module(prefix);
        const result = regex.exec(tc.text);
        if (tc.assert === null) {
          expect(result).toBe(tc.assert);
        } else {
          expect(result[1]).toBe(tc.assert);
        }
      });
    });
  });

  describe('regexOnEs6Export', () => {
    const testCases = [
      { text: `import ${prefix}`, assert: `${prefix}` },
      { text: `import   a${prefix} as name from `, assert: `a${prefix}` },
      { text: `import { export-${prefix}`, assert: `export-${prefix}` },
      { text: `import {${prefix}`, assert: `${prefix}` },
      { text: `import { ${prefix} as alias")`, assert: `${prefix}` },
      { text: `import default${prefix}, * as name`, assert: `default${prefix}` },
    ];

    testCases.forEach((tc) => {
      it(`should have result of ${tc.assert} for line "${tc.text}"`, () => {
        const regex = subject.regexOnEs6Export(prefix);
        const result = regex.exec(tc.text);
        if (tc.assert === null) {
          expect(result).toBe(tc.assert);
        } else {
          expect(result[1]).toBe(tc.assert);
        }
      });
    });
  });

  describe('regexOnCjsExport', () => {
    const testCases = [
      { text: `var { something, ${prefix}} = require('jquery');`, assert: `something, ${prefix}` },
      //{ text: `const {${prefix}, `, assert: `${prefix}` },
      { text: `let { export-${prefix}`, assert: `export-${prefix}` },
      { text: `const ${prefix} =`, assert: null }
    ];

    testCases.forEach((tc) => {
      it(`should have result of ${tc.assert} for line "${tc.text}"`, () => {
        const regex = subject.regexOnCjsExport(prefix);
        const result = regex.exec(tc.text);
        if (tc.assert === null) {
          expect(result).toBe(tc.assert);
        } else {
          expect(result[1]).toBe(tc.assert);
        }
      });
    });
  });
});

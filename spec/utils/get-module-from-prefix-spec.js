const subject = require('../../lib/utils/get-module-from-prefix');

describe('getRealImportPrefix', () => {

  it('should return the existing parts of the module name', () => {
    const result = subject('tes', `const {} = require('thistes')`);

    expect(result).toBe('thistes');
  });

  it('should return false if prefix was not part of the module', () => {
    const result = subject('tes', `const { test } = require('this')`);

    expect(result).toBe(false);
  });

  it('should return empty if prefix was on module', () => {
    const result = subject('', `import Something from ''`);

    expect(result).toBe('');
  });

});

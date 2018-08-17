const subject = require('../../lib/utils/get-exports-from-prefix');

describe('getRealExportPrefix', () => {

  it('should return the relevant part of the exports (delimiter of commas)', () => {
    const result = subject('tes', `import {nothis, buttes, thatone}`);

    expect(result).toBe('buttes');
  });

  it('should return false if prefix was not part of the module', () => {
    const result = subject('tes', `const { noexist } = require('haha')`);

    expect(result).toBe(false);
  });
});

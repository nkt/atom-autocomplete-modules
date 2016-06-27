/* eslint-env mocha */
const assert = require('chai').assert;

const normalizeLocal = require('./normalize-local');

describe('normalize-local', () => {
  it('should normalize local filenames with js\'like extensions', () => {
    assert.equal(normalizeLocal('test.js'), 'test');
    assert.equal(normalizeLocal('test.es6'), 'test');
    assert.equal(normalizeLocal('test.jsx'), 'test');
    assert.equal(normalizeLocal('test.coffee'), 'test');
    assert.equal(normalizeLocal('test.ts'), 'test');
    assert.equal(normalizeLocal('test.tsx'), 'test');
  });
});

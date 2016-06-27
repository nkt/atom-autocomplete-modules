/* eslint-env mocha */

const assert = require('chai').assert;
const rewire = require('rewire');

const lookupWebpack = rewire('./lookup-webpack');

describe('lookup-webpack', () => {
  describe('#getWebpackModuleSearchPaths()', () => {
    it('should fetch modules search paths', () => {
      const getWebpackModuleSearchPaths = lookupWebpack.__get__('getWebpackModuleSearchPaths');
      const webpackConfig = {
        resolve: {
          modulesDirectories: ['node_modules'],
          root: ['/path/to/app'],
          fallback: ['modules']
        }
      };

      const actual = getWebpackModuleSearchPaths(webpackConfig);
      const expected = ['node_modules', '/path/to/app', 'modules'];

      assert.isArray(actual);
      assert.deepEqual(actual, expected);
    });
  });

  describe('#getWebpack2ModuleSearchPaths()', () => {
    it('should fetch modules search paths', () => {
      const getWebpack2ModuleSearchPaths = lookupWebpack.__get__('getWebpack2ModuleSearchPaths');
      const webpackConfig = {
        resolve: {
          modules: ['node_modules', '/path/to/app', 'modules']
        }
      };

      const actual = getWebpack2ModuleSearchPaths(webpackConfig);
      const expected = ['node_modules', '/path/to/app', 'modules'];

      assert.isArray(actual);
      assert.deepEqual(actual, expected);
    });
  });


  describe('#isWebpack2()', () => {
    const isWebpack2 = lookupWebpack.__get__('isWebpack2');

    it('should detect webpack v2', () => {
      const webpackConfig = {
        resolve: {
          modules: ['node_modules', '/path/to/app', 'modules']
        }
      };

      assert.isTrue(isWebpack2(webpackConfig));
    });

    it('should detect webpack v1', () => {
      const webpackConfig = {
        resolve: {
          modulesDirectories: ['node_modules']
        }
      };

      assert.isFalse(isWebpack2(webpackConfig));
    });
  });
});

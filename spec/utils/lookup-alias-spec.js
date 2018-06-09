const subject = require('../../lib/utils/lookup-alias');
const { fixturesBasePath: basePath } = require('../spec-helper');

const aliases = [{
  expose: '@sub',
  src: `${basePath}/subfolder`
}, {
  expose: '@library',
  src: `${basePath}/node_modules/commonjs`
}];

describe('lookupAlias', () => {
  it('should lookup subfolder alias', (done) => {
    const prefix = '@sub/subfile';

    subject(prefix, basePath, aliases).then((results) => {
      expect(results.length).toBe(1);

      expect(results[0].prefixWithoutAlias).toBe('subfile');
      expect(results[0].pathToAlias).toBe(`${basePath}/subfolder`);
      done();
    });
  });
});

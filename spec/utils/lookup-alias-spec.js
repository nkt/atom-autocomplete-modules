const subject = require('../../lib/utils/lookup-alias');
const { fixturesBasePath: basePath, async } = require('../spec-helper');

const aliases = [{
  expose: '@sub',
  src: `${basePath}/subfolder`
}, {
  expose: '@library',
  src: `${basePath}/node_modules/somepackage`
}];

describe('lookupAlias', () => {
  it('should lookup subfolder alias', async((done) => {
    const prefix = '@sub/subfile';

    subject(prefix, basePath, aliases).then((results) => {
      done(() => {
        expect(results.length).toBe(1);

        expect(results[0].prefixWithoutAlias).toBe('subfile');
        expect(results[0].pathToAlias).toBe(`${basePath}/subfolder`);
      });
    });
  }));
  describe('Throws false for error', () => {
    it('should when no alias given', async((done) => {
      subject('@sub/subfile', basePath, null).catch((result) => {
        done(() => {
          expect(result).toBe(false);
        });
      });
    }));
  });
});

'use babel';

/**
 * Helper function for getting the base path of the current project
 * @return {string|undefined}
 */
module.exports = function getProjectPath() {
  return atom.project.getPaths()[0];
};

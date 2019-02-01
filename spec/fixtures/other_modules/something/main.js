// Used to check different nodejs imports
// and to ensure file lookups do not execute code

global.outsideTestCase = true;

module.exports = function() { global.insideTestCase = true; };

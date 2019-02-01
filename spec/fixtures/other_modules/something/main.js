// Used to ensure file lookups do not execute code

global.outsideTestCase = true;

module.exports = function() { global.insideTestCase = true; };

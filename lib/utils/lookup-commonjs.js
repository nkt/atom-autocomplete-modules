const path = require('path');
const fs = require('fs');
const acorn = require('acorn');

module.exports = function lookupCommonjs(importFile, projectPath) {
  try {
    const absoluteFile = path.resolve(projectPath, importFile);
    const ast = acorn.parse(
      fs.readFileSync(
        require.resolve(
          path.normalize(absoluteFile)
      )));
    return getExports(ast);
  } catch(_e) {
      return [];
  }

  function getExports(ast) {
    return ast.body.reduce((exports, node) => {
      if(node.type === 'ExpressionStatement') {
         if (node.expression.left.object.name === 'module' &&
            node.expression.left.property.name === 'exports')
            {
              return exports.concat(getExportStatements(node.expression.right));
            }
      }
    }, []);
  }

  function getExportStatements(node) {
    switch (node.type) {
      case 'FunctionExpression':
        return [getFunctionName(node)];
      case 'ObjectExpression':
        return getObjects(node);
      case 'Literal':
        return node.value;
      default:
        console.error([{
          scope: 'lib-lookup-common-acorn-type',
          prefix: node.type,
          additional: []
        }, new Error().stack]); /* eslint no-console: "off" */
        return [];
    }
  }

  function getFunctionName(node) {
    return node.id ? node.id.name : '';
  }
  function getObjects(node) {
    return node.properties.map(prop => prop.key.name);
  }
};

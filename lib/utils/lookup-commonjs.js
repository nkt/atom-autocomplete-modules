const path = require('path');
const fs = require('fs');
const acorn = require('acorn');

const Exportables = [
  { // module.exports =
    condition: (node) =>
      node.expression.left.object && node.expression.left.object.name === 'module'
      && node.expression.left.property.name === 'exports',
    extract: getExportStatementsFromRight,
    allowMultiple: false
  }, { // exports =
    condition: (node) =>
      node.expression.left.name && node.expression.left.name === 'exports'
      && node.expression.left.type === 'Identifier',
    extract: getExportStatementsFromRight,
    allowMultiple: false
  }, { // exports.* =
    condition: (node) =>
      node.expression.left.object && node.expression.left.object.name === 'exports'
      && node.expression.left.property.type === 'Identifier',
    extract: getExportStatementsFromLeft,
    allowMultiple: true
  }, { // module.exports.* =
    condition: (node) =>
      node.expression.left.object && node.expression.left.object.object && node.expression.left.object.object.name === 'module'
      && node.expression.left.object.property.name === 'exports',
    extract: getExportStatementsFromLeft,
    allowMultiple: true
  }
];

function getExportStatementsFromRight(node) {
  switch (node.expression.right.type) {
    case 'ObjectExpression':
      return getObjects(node.expression.right);
    case 'Literal':
    case 'FunctionExpression':
      return [];
    default:
      console.error([{
        scope: 'lib-lookup-common-acorn-type',
        prefix: node.expression.right.type,
        additional: []
      }, new Error().stack]); /* eslint no-console: "off" */
      return [];
  }
}

function getObjects(node) {
  return node.properties.map(prop => prop.key.name);
}

function getExportStatementsFromLeft(node) {
    return [node.expression.left.property.name];
}

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
         const exportable = Exportables.find(i => i.condition(node));
         if (!exportable) return exports;

         // last out if does not allow multiple willl over ride it
         return exportable.allowMultiple ?
          exports.concat(exportable.extract(node))
          : exportable.extract(node);
      }
    }, []);
  }
};

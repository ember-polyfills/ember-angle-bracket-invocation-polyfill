'use strict';

const expressionForAttributeValue = require('./expression-for-attribute-value');

function attrsAsHash(b, attrs) {
  if (attrs.length > 0) {
    return b.sexpr(
      'hash',
      [],
      b.hash(
        attrs.map(attr =>
          b.pair(attr.name, expressionForAttributeValue(b, attr.value), attr.loc)
        )
      )
    );
  }
}

module.exports = function angleAttrsExpression(b, attributes) {
  let preSplatAttributes = [];
  let postSplatAttributes = [];
  let foundSplat = false;

  for (let i = 0; i < attributes.length; i++) {
    let attr = attributes[i];
    if (attr.name === '...attributes') {
      foundSplat = true;
    } else {
      if (foundSplat) {
        postSplatAttributes.push(attr);
      } else {
        preSplatAttributes.push(attr);
      }
    }
  }

  let attrGroups = [
    attrsAsHash(b, preSplatAttributes),
    foundSplat && b.path('__ANGLE_ATTRS__'),
    attrsAsHash(b, postSplatAttributes),
  ].filter(Boolean);
  if (attrGroups.length > 1) {
    return b.sexpr('-merge-attrs', attrGroups);
  } else {
    return attrGroups[0];
  }
}

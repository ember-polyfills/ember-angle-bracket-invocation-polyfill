'use strict';

const angleAttrsExpression = require('./helpers/angle-attrs-expression');
const expressionForAttributeValue = require('./helpers/expression-for-attribute-value');
const getTag = require('./helpers/get-tag');

const reLines = /(.*?(?:\r\n?|\n|$))/gm;
const attributeToPropertyMap = {
  role: 'ariaRole',
};

class AngleBracketInputPolyfill {
  constructor(options) {
    this.syntax = null;
    this.sourceLines = options.contents && options.contents.match(reLines);
  }

  transform(ast) {
    let b = this.syntax.builders;
    let { sourceLines } = this;

    // in order to debug in https://https://astexplorer.net/#/gist/0590eb883edfcd163b183514df4cc717
    // **** copy from here ****
    let visitor = {
      ElementNode(node) {
        let tag = getTag(node, sourceLines);

        if (tag === 'Input' || tag === 'Textarea') {
          let { attributes } = node;

          let props = attributes
            .filter(({ name }) => name.charAt(0) === '@')
            .map(attribute => Object.assign({}, attribute, { name: attribute.name.slice(1) }));
          let mappedAttrs = attributes
            .filter(({ name }) => name.charAt(0) !== '@' && attributeToPropertyMap[name])
            .map(attribute =>
              Object.assign({}, attribute, { name: attributeToPropertyMap[attribute.name] }));
          let attrs = attributes.filter(({ name }) => name.charAt(0) !== '@' && !attributeToPropertyMap[name]);


          let hash = b.hash(
            [...props, ...mappedAttrs].map(({ name, value, loc }) =>
              b.pair(name, expressionForAttributeValue(b, value), loc)
            )
          );

          if (attrs.length > 0) {
            hash.pairs.push(b.pair('__ANGLE_ATTRS__', angleAttrsExpression(b, attrs)));
          }

          return b.mustache(b.path(tag.toLowerCase()), null, hash, false, node.loc);
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketInputPolyfill;

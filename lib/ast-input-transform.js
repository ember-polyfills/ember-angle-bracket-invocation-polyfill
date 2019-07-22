'use strict';

const attributeToPropertyMap = {
  role: 'ariaRole',
};

class AngleBracketInputPolyfill {
  transform(ast) {
    let b = this.syntax.builders;

    // in order to debug in https://https://astexplorer.net/#/gist/0590eb883edfcd163b183514df4cc717
    // **** copy from here ****
    function transformAttributeValue(attributeValue) {
      switch (attributeValue.type) {
        case 'TextNode':
          return b.string(attributeValue.chars);
        case 'MustacheStatement':
          return b.path(attributeValue.path);
      }
    }

    let visitor = {
      ElementNode(node) {
        let tag = node.tag.toLowerCase();

        if (tag === 'input' || tag === 'textarea') {
          let { attributes } = node;

          let props = attributes
            .filter(({ name }) => name.charAt(0) === '@')
            .map(attribute => Object.assign({}, attribute, { name: attribute.name.slice(1) }));
          let attrs = attributes.map(attribute =>
            attributeToPropertyMap[attribute.name]
              ? Object.assign({}, attribute, { name: attributeToPropertyMap[attribute.name] })
              : attribute
          );

          let hash = b.hash(
            [...props, ...attrs].map(({ name, value, loc }) =>
              b.pair(name, transformAttributeValue(value), loc)
            )
          );

          return b.mustache(b.path(tag), null, hash, false, node.loc);
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketInputPolyfill;

'use strict';

const reservedProps = ['@route', '@model', '@models', '@query'];
const supportedHTMLAttributes = ['id', 'class', 'rel', 'tabindex', 'title', 'target', 'role'];
const attributeToPropertyMap = {
  role: 'ariaRole',
};

class AngleBracketLinkToPolyfill {
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
        if (node.tag.toLowerCase() === 'linkto') {
          let { children, blockParams, attributes } = node;
          let params = [];
          let helperParams = [];

          let route = attributes.find(({ name }) => name === '@route');
          let model = attributes.find(({ name }) => name === '@model');
          let models = attributes.find(({ name }) => name === '@models');
          let query = attributes.find(({ name }) => name === '@query');

          if (model && models) {
            throw new Error(
              'You cannot provide both the `@model` and `@models` arguments to the <LinkTo> component.'
            );
          }

          let needsParamsHelper =
            (models && models.value.path.original !== 'array') ||
            (query && query.value.path.original !== 'hash');

          if (route) {
            if (needsParamsHelper) {
              helperParams.push(b.pair('route', transformAttributeValue(route.value)));
            } else {
              params.push(transformAttributeValue(route.value));
            }
          }

          if (model) {
            if (needsParamsHelper) {
              helperParams.push(b.pair('model', transformAttributeValue(model.value)));
            } else {
              params.push(transformAttributeValue(model.value));
            }
          }

          if (models) {
            if (models.value.path.original === 'array') {
              params.push(...models.value.params);
            } else {
              helperParams.push(b.pair('models', transformAttributeValue(models.value)));
            }
          }

          if (query) {
            if (query.value.path.original === 'hash') {
              params.push(b.sexpr('query-params', null, query.value.hash, query.loc));
            } else {
              helperParams.push(b.pair('query', transformAttributeValue(query.value)));
            }
          }

          let props = attributes
            .filter(({ name }) => name.charAt(0) === '@' && !reservedProps.includes(name))
            .map(attribute => Object.assign({}, attribute, { name: attribute.name.slice(1) }));
          let attrs = attributes
            .filter(({ name }) => supportedHTMLAttributes.includes(name))
            .map(attribute =>
              attributeToPropertyMap[attribute.name]
                ? Object.assign({}, attribute, { name: attributeToPropertyMap[attribute.name] })
                : attribute
            );

          let hash = b.hash(
            [...props, ...attrs].map(({ name, value, loc }) =>
              b.pair(name, transformAttributeValue(value), loc)
            )
          );

          if (needsParamsHelper) {
            hash.pairs.push(
              b.pair('params', b.sexpr('-link-to-params', null, b.hash(helperParams)))
            );

            return b.block(
              b.path('link-to'),
              null,
              hash,
              b.program(children, blockParams),
              null,
              node.loc
            );
          } else {
            return b.block(
              b.path('link-to'),
              params,
              hash,
              b.program(children, blockParams),
              null,
              node.loc
            );
          }
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketLinkToPolyfill;

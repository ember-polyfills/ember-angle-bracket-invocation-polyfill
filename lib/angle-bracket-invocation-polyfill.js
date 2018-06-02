"use strict";

class AngleBracketPolyfill {
  constructor() {
    this.syntax = null;
  }
  transform(ast) {
    let b = this.syntax.builders;

    // in order to debug in https://astexplorer.net/#/gist/5e923e7322de5052a26a5a292f8c3995/
    // **** copy from here ****
    function dasherize(string) {
      return string.replace(/[A-Z]/g, function (char, index) {
        return (index !== 0 ? '-' : '') + char.toLowerCase();
      });
    }
    
    function isSimple(mustache) {
      return mustache.params.length === 0 && mustache.hash.pairs.length === 0;
    }

    function expressionForAttributeValue(value) {
      if (value.type === 'TextNode') {
        return b.literal(value.chars);
      } else if (value.type === 'MustacheStatement') {
        // TODO: Resolve ambiguous case data-foo="{{is-this-a-helper}}"
        if (isSimple(value)) {
          return value.path;
        } else {
          return b.sexpr(value.path, value.params, value.hash, value.loc);
        }
      } else if (value.type === 'ConcatStatement') {
        return b.sexpr('concat', value.parts.map(expressionForAttributeValue));
      }
    }

    function getInvocationDetails(element) {
      let invocationFirstChar = element.tag[0];
      let isNamedArgument = invocationFirstChar === '@';
      let isPath = element.tag.indexOf('.') > -1;
      let [ maybeLocal ] = element.tag.split('.');
      let isLocal = locals.indexOf(maybeLocal) !== -1;
      let isUpperCase = invocationFirstChar === invocationFirstChar.toUpperCase() && invocationFirstChar !== invocationFirstChar.toLowerCase();
      let { selfClosing } = element; // TODO: Look into selfClosing support for older Ember versions...

      if (isLocal || isNamedArgument || isPath) {
        return {
          kind: 'DynamicComponent',
          path: b.path(element.tag),
          selfClosing
        }
      } else if (isUpperCase) {
        return {
          kind: 'StaticComponent',
          componentName: dasherize(element.tag),
          selfClosing,
        }
      } else {
        return { kind: 'Element' };
      }
    }

    let locals = [];

    let visitor = {
      Program: {
        enter(node) {
          locals.push(...node.blockParams);
        },
        exit(node) {          
          for (let i = 0; i < node.blockParams.length; i++) {
            locals.pop();
          }
        }
      },

      ElementNode(node) {
        let invocation = getInvocationDetails(node);

        if (invocation.kind === 'Element') { return; }
        
        let { children, blockParams } = node;

        let attributes = node.attributes.filter(node => node.name[0] !== '@');
        let args = node.attributes.filter(node => node.name[0] === '@');

        let hash = b.hash(args.map(arg =>
          b.pair(
            arg.name.slice(1),
            expressionForAttributeValue(arg.value),
            arg.loc
          )
        ));
        // AttrNode.value: TextNode | MustacheStatement | ConcatStatement;

        if (invocation.kind === 'StaticComponent') {
          if (invocation.selfClosing === true) { 
            return b.mustache(invocation.componentName, null, hash, false, node.loc);
          } else {
            return b.block(invocation.componentName, null, hash, b.program(children, blockParams), null, node.loc);
          }
        } else {
          return b.block(
            'component',
            [invocation.path],
            hash,
            b.program(children, blockParams),
            null,
            node.loc
          );
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketPolyfill;

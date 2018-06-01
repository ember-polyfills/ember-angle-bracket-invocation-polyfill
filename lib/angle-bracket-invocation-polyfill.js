"use strict";

class AngleBracketPolyfill {
  constructor() {
    this.syntax = null;
  }
  transform(ast) {
    let b = this.syntax.builders;

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

    function isDynamicComponent(element) {
      let isNamedArgument = element.tag[0] === '@';
      let isPath = element.tag.indexOf('.') > -1;
      let possibleLocal = isPath ? element.tag.split('.')[0] : element.tag;
      let isLocal = locals.indexOf(possibleLocal) !== -1;
    
      return isLocal || isNamedArgument || isPath;
    }
    
    function isComponent(element) {
      let open = element.tag.charAt(0);
    
      let isUpperCase = open === open.toUpperCase() && open !== open.toLowerCase();
    
      return isUpperCase || isDynamicComponent(element);
    }

    function getInvocationKind(element) {
      let isNamedArgument = element.tag[0] === '@';
      if (isNamedArgument) return 'DynamicComponent';

      let isPath = element.tag.indexOf('.') > -1;
      let possibleLocal = isPath ? element.tag.split('.')[0] : element.tag;
      let isLocal = locals.indexOf(possibleLocal) !== -1;
      if (isLocal) return 'DynamicComponent';

    }

    let locals = [];

    let visitors = {
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
        let invocationKind = getInvocationKind(node);

        if (!isComponent(node)) { return; }
        
        // TODO: Look into selfClosing support
        let { selfClosing, tag, children, blockParams } = node;
        let dasherizedTag = dasherize(tag);

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

        if (invocationKind === 'Element') {
          return;
        } else if (invocationKind === 'StaticComponent') {
          if (selfClosing === true) { 
            return b.mustache(dasherizedTag, null, hash, false, node.loc);
          } else {
            return b.block(dasherizedTag, null, hash, b.program(children, blockParams), null, node.loc);
          }
        } else {
          throw 'unimplemented';
        }
      },
    };

    this.syntax.traverse(ast, visitors);

    return ast;
  }
}

module.exports = AngleBracketPolyfill;

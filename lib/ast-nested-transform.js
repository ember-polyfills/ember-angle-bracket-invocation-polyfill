'use strict';

const reLines = /(.*?(?:\r\n?|\n|$))/gm;
const ALPHA = /[A-Za-z]/;

class AngleBracketPolyfill {
  constructor(options) {
    this.syntax = null;
    this.sourceLines = options.contents && options.contents.match(reLines);
  }

  transform(ast) {
    let b = this.syntax.builders;

    function dasherize(string) {
      return string.replace(/[A-Z]/g, function(char, index) {
        if (index === 0 || !ALPHA.test(string[index - 1])) {
          return char.toLowerCase();
        }

        return `-${char.toLowerCase()}`;
      });
    }

    function replaceNestedComponents(string) {
      return string.replace('::', '/');
    }

    function getBlockParamName(node) {
      let unnestedName = node.tag.replace('::', '');
      let possibleName = unnestedName;

      const nestedNames = node.children
        .map(child => {
          switch (child.type) {
            case 'ElementNode':
              return child.tag;
            case 'MustacheStatement':
              return child.path.original;
            default:
              break;
          }
        })
        .filter(child => child);

      let adder = 0;
      while (nestedNames.indexOf(possibleName) !== -1) {
        adder++;
        possibleName = `${unnestedName}${adder}`;
      }

      return possibleName;
    }

    function wrapAngeBrackedComponentWithLetHelper(node) {
      let tag = node.tag;

      let params = [
        b.sexpr(b.path('component'), [b.string(dasherize(replaceNestedComponents(tag)))]),
      ];

      node.tag = getBlockParamName(node);
      let program = b.program([node], [getBlockParamName(node)]);
      program.__ignore = true;

      return b.block('let', params, b.hash([]), program, null, null);
    }

    let visitor = {
      ElementNode(node) {
        let tag = node.tag;

        if (tag.indexOf('::') !== -1 && tag.charAt(0) === tag.charAt(0).toUpperCase()) {
          let newNode = wrapAngeBrackedComponentWithLetHelper(node);

          return newNode;
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketPolyfill;

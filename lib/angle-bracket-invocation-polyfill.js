"use strict";

const reLines = /(.*?(?:\r\n?|\n|$))/gm;

class AngleBracketPolyfill {
  constructor(options) {
    this.syntax = null;
    this.sourceLines = options.contents && options.contents.match(reLines);
  }

  transform(ast) {
    let b = this.syntax.builders;
    let { sourceLines } = this;
    let hasSourceAvailable = sourceLines && sourceLines.length > 0;

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
        return b.string(value.chars);
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

    // politely lifted from https://github.com/glimmerjs/glimmer-vm/blob/v0.35.0/packages/%40glimmer/syntax/lib/parser.ts#L113-L149
    function sourceForNode(node) {
        let firstLine = node.loc.start.line - 1;
        let currentLine = firstLine - 1;
        let firstColumn = node.loc.start.column;
        let string = [];
        let line;

        let lastLine = node.loc.end.line - 1;
        let lastColumn = node.loc.end.column;

        while (currentLine < lastLine) {
          currentLine++;
          line = sourceLines[currentLine];

          if (currentLine === firstLine) {
            if (firstLine === lastLine) {
              string.push(line.slice(firstColumn, lastColumn));
            } else {
              string.push(line.slice(firstColumn));
            }
          } else if (currentLine === lastLine) {
            string.push(line.slice(0, lastColumn));
          } else {
            string.push(line);
          }
        }

        return string.join('\n');
    }

    function getSelfClosing(element) {
      if ('selfClosing' in element) { return element.selfClosing; }
      if (!hasSourceAvailable) { return false; }

      let nodeSource = sourceForNode(element);
      let firstClosingBracketIndex = nodeSource.indexOf('>');

      return nodeSource[firstClosingBracketIndex - 1] === '/';
    }

    function getInvocationDetails(element) {
      let invocationFirstChar = element.tag[0];
      let isNamedArgument = invocationFirstChar === '@';
      let isPath = element.tag.indexOf('.') > -1;
      let [maybeLocal] = element.tag.split('.');
      let isLocal = locals.indexOf(maybeLocal) !== -1;
      let isUpperCase = invocationFirstChar === invocationFirstChar.toUpperCase() && invocationFirstChar !== invocationFirstChar.toLowerCase();
      let selfClosing = getSelfClosing(element);

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

        if (attributes.length > 0) {
          hash.pairs.push(
            b.pair(
              '__HTML_ATTRIBUTES__',
              b.sexpr(
                'hash',
                [],
                b.hash(attributes.map(attr =>
                  b.pair(attr.name, expressionForAttributeValue(attr.value), attr.loc)
                ))
              )
            )
          );
        }

        if (invocation.kind === 'StaticComponent') {
          if (invocation.selfClosing === true) {
            return b.mustache(invocation.componentName, null, hash, false, node.loc);
          } else {
            return b.block(invocation.componentName, null, hash, b.program(children, blockParams), null, node.loc);
          }
        } else {
          if (invocation.selfClosing === true) {
            return b.mustache(
              'component',
              [invocation.path],
              hash,
              null,
              node.loc
            );
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
        }
      },
    };
    // **** copy to here ****

    this.syntax.traverse(ast, visitor);

    return ast;
  }
}

module.exports = AngleBracketPolyfill;

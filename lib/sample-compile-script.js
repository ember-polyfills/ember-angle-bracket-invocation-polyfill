'use strict';
/* eslint-disable node/no-unpublished-require */

/*
  This script is pretty useful for launching a single template compilation
  with our script:

  node --inspect-brk lib/sample-compile-script.js
*/

const compiler = require('ember-source/dist/ember-template-compiler');
compiler.registerPlugin('ast', require('./ast-transform'));

let template = '<span ...attributes>hi martin!</span>';
let output = compiler.precompile(template, { contents: template });
console.log(output); // eslint-disable-line no-console

'use strict';

module.exports = {
  name: 'ember-angle-bracket-invocation-polyfill',

  setupPreprocessorRegistry(type, registry) {
    registry.add('htmlbars-ast-plugin', {
      name: 'component-attributes',
      plugin: require('./lib/angle-bracket-invocation-polyfill'),
      baseDir() {
        return __dirname;
      }
    });
  },
};

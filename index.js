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

  included() {
    this._super.included.apply(this, arguments);

    // TODO: only do this if ember-source < 3.4
    this.import("vendor/angle-bracket-invocation-polyfill/index.js");
  },

  treeForVendor(rawVendorTree) {
    let babelAddon = this.addons.find(addon => addon.name === "ember-cli-babel");

    let transpiledVendorTree = babelAddon.transpileTree(rawVendorTree, {
      "ember-cli-babel": {
        compileModules: false
      }
    });

    return transpiledVendorTree;
  },
};

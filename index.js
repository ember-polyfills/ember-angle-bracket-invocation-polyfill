'use strict';

const VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: 'ember-angle-bracket-invocation-polyfill',

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    let checker = new VersionChecker(this.project);
    let emberVersion = checker.forEmber();

    this.shouldPolyfill = emberVersion.lt('3.4.0-alpha.1');
  },

  setupPreprocessorRegistry(type, registry) {
    if (this.shouldPolyfill) {
      registry.add('htmlbars-ast-plugin', {
        name: 'component-attributes',
        plugin: require('./lib/angle-bracket-invocation-polyfill'),
        baseDir() {
          return __dirname;
        },
      });
    }
  },

  included() {
    this._super.included.apply(this, arguments);

    if (!this.shouldPolyfill) {
      return;
    }

    this.import('vendor/angle-bracket-invocation-polyfill/index.js');
  },

  treeForVendor(rawVendorTree) {
    if (!this.shouldPolyfill) {
      return;
    }

    let babelAddon = this.addons.find(addon => addon.name === 'ember-cli-babel');

    let transpiledVendorTree = babelAddon.transpileTree(rawVendorTree, {
      'ember-cli-babel': {
        compileModules: false,
      },
    });

    return transpiledVendorTree;
  },
};

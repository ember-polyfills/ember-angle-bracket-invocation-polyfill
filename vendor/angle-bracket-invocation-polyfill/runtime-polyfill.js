/* globals Ember */
/* eslint-disable ember/new-module-imports */
import { lte, gte } from 'ember-compatibility-helpers';

(function() {
  const P = Ember.__loader.require('container').privatize;
  const { Application, Component, computed, getOwner } = Ember;
  const { combineTagged } = Ember.__loader.require(
    gte('2.13.0-alpha.1') ? '@glimmer/reference' : 'glimmer-reference'
  );
  const { clientBuilder } = Ember.__loader.require(
    gte('2.13.0-alpha.1') ? '@glimmer/runtime' : 'glimmer-runtime'
  );

  class WrappedNamedArguments {
    constructor(references) {
      this.references = references;

      let referencesArray = [];
      for (let reference in references) {
        referencesArray.push(references[reference]);
      }
      this.tag = combineTagged(referencesArray);
    }

    value() {
      return this.references;
    }
  }

  function mergeRefsHelper(_vm, args) {
    let invocationReferences = args.named.has('invocation') && args.named.get('invocation');
    let splatReferences = args.named.has('splat') && args.named.get('splat').value();

    let references = {};

    if (invocationReferences) {
      let names = gte('2.15.0-beta.1') ? invocationReferences.names : invocationReferences.keys;
      for (let i = 0; i < names.length; i++) {
        let name = names[i];
        let reference = invocationReferences.get(name);

        references[name] = reference;
      }
    }

    if (splatReferences) {
      for (let attributeName in splatReferences) {
        references[attributeName] = splatReferences[attributeName];
      }
    }

    return new WrappedNamedArguments(references);
  }

  if (gte('3.1.0-beta.1')) {
    Application.reopenClass({
      buildRegistry() {
        let registry = this._super(...arguments);

        let compilerName = gte('3.2.0-alpha.1')
          ? P`template-compiler:main`
          : P`template-options:main`;
        let TemplateCompiler = registry.resolve(compilerName);

        let originalCreate = TemplateCompiler.create;
        TemplateCompiler.create = function(options) {
          let owner = getOwner(options);
          let compiler = originalCreate(...arguments);
          let compileTimeLookup = compiler.resolver;
          let runtimeResolver = compileTimeLookup.resolver;

          // setup our reference capture system
          runtimeResolver.builtInHelpers['-merge-refs'] = mergeRefsHelper;

          class AttributeTracker {
            constructor(environment, element, attributeName, reference) {
              this._environment = environment;
              this._attribute = environment.attributeFor(element, attributeName, false);
              this._reference = reference;
              this.tag = reference.tag;
              this.lastRevision = this.tag.value();
            }

            set(dom) {
              this._attribute.set(dom, this._reference.value(), this._environment);
              this.lastRevision = this.tag.value();
            }

            update() {
              if (!this.tag.validate(this.lastRevision)) {
                this._attribute.update(this._reference.value(), this._environment);
                this.lastRevision = this.tag.value();
              }
            }
          }

          runtimeResolver.builtInModifiers._splattributes = {
            create(element, args, scope, dom) {
              let environment = owner.lookup('service:-glimmer-environment');
              let domBuilder = clientBuilder(environment, {});
              domBuilder.constructing = element;

              let { positional } = args.capture();
              let invocationAttributesReference = positional.at(0);
              let invocationAttributes = invocationAttributesReference.value();
              let attributeNames = invocationAttributes ? Object.keys(invocationAttributes) : [];
              let dynamicAttributes = {};

              for (let i = 0; i < attributeNames.length; i++) {
                let attributeName = attributeNames[i];
                dynamicAttributes[attributeName] = new AttributeTracker(
                  environment,
                  element,
                  attributeName,
                  invocationAttributes[attributeName]
                );
              }

              return {
                invocationAttributes,
                dynamicAttributes,
                dom,
                domBuilder,
                environment,
              };
            },

            getTag({ invocationAttributes }) {
              let referencesArray = [];
              for (let reference in invocationAttributes) {
                referencesArray.push(invocationAttributes[reference]);
              }
              return combineTagged(referencesArray);
            },

            install(bucket) {
              let { dynamicAttributes, domBuilder } = bucket;

              for (let name in dynamicAttributes) {
                let attribute = dynamicAttributes[name];
                attribute.set(domBuilder);
              }
            },

            update(bucket) {
              let { dynamicAttributes } = bucket;

              for (let name in dynamicAttributes) {
                let attribute = dynamicAttributes[name];
                attribute.update();
              }
            },

            getDestructor() {},
          };

          // setup our custom attribute bindings directly from the references passed in
          let ORIGINAL_LOOKUP_COMPONENT_DEFINITION = runtimeResolver._lookupComponentDefinition;
          let installedCustomDidCreateElement = false;
          runtimeResolver._lookupComponentDefinition = function() {
            // call the original implementation
            let definition = ORIGINAL_LOOKUP_COMPONENT_DEFINITION.apply(this, arguments);

            if (!installedCustomDidCreateElement && definition) {
              let { manager } = definition;

              let ORIGINAL_DID_CREATE_ELEMENT = manager.didCreateElement;
              manager.didCreateElement = function(bucket, element, operations) {
                ORIGINAL_DID_CREATE_ELEMENT.apply(this, arguments);
                let { args } = bucket;
                if (args.has('__ANGLE_ATTRS__')) {
                  let attributeReferences = args.get('__ANGLE_ATTRS__').value();
                  for (let attributeName in attributeReferences) {
                    let attributeReference = attributeReferences[attributeName];

                    operations.setAttribute(attributeName, attributeReference, false, null);
                  }
                }
              };

              installedCustomDidCreateElement = true;
            }

            return definition;
          };

          return compiler;
        };

        return registry;
      },
    });
  } else if (gte('2.12.0-beta.1')) {
    Application.reopenClass({
      buildRegistry() {
        let registry = this._super(...arguments);

        let Environment = registry.resolve('service:-glimmer-environment');
        let ORIGINAL_ENVIRONMENT_CREATE = Environment.create;
        Environment.create = function() {
          let environment = ORIGINAL_ENVIRONMENT_CREATE.apply(this, arguments);
          let installedCustomDidCreateElement = false;

          environment.builtInHelpers['-merge-refs'] = mergeRefsHelper;

          class AttributeTracker {
            constructor(element, attributeName, reference) {
              this._element = element;
              this._attribute = environment.attributeFor(element, attributeName, false);
              this._reference = reference;
              this.tag = reference.tag;
              this.lastRevision = this.tag.value();
            }

            set() {
              this._attribute.setAttribute(environment, this._element, this._reference.value());
              this.lastRevision = this.tag.value();
            }

            update() {
              if (!this.tag.validate(this.lastRevision)) {
                this._attribute.updateAttribute(
                  environment,
                  this._element,
                  this._reference.value()
                );
                this.lastRevision = this.tag.value();
              }
            }
          }

          environment.builtInModifiers._splattributes = {
            create(element, args, scope, dom) {
              let positional = gte('2.15.0-beta.1') ? args.capture().positional : args.positional;
              let invocationAttributesReference = positional.at(0);
              let invocationAttributes = invocationAttributesReference.value();
              let attributeNames = invocationAttributes ? Object.keys(invocationAttributes) : [];
              let dynamicAttributes = {};

              for (let i = 0; i < attributeNames.length; i++) {
                let attributeName = attributeNames[i];
                dynamicAttributes[attributeName] = new AttributeTracker(
                  element,
                  attributeName,
                  invocationAttributes[attributeName]
                );
              }

              return {
                invocationAttributes,
                dynamicAttributes,
                dom,
                environment,
              };
            },

            getTag({ invocationAttributes }) {
              let referencesArray = [];
              for (let reference in invocationAttributes) {
                referencesArray.push(invocationAttributes[reference]);
              }
              return combineTagged(referencesArray);
            },

            install(bucket) {
              let { dynamicAttributes } = bucket;

              for (let name in dynamicAttributes) {
                let attribute = dynamicAttributes[name];
                attribute.set();
              }
            },

            update(bucket) {
              let { dynamicAttributes } = bucket;

              for (let name in dynamicAttributes) {
                let attribute = dynamicAttributes[name];
                attribute.update();
              }
            },

            getDestructor() {},
          };

          let originalGetComponentDefinition = environment.getComponentDefinition;
          environment.getComponentDefinition = function() {
            let definition = originalGetComponentDefinition.apply(this, arguments);

            if (!installedCustomDidCreateElement && definition) {
              installedCustomDidCreateElement = true;

              let { manager } = definition;

              let ORIGINAL_DID_CREATE_ELEMENT = manager.didCreateElement;
              manager.didCreateElement = function(bucket, element, operations) {
                ORIGINAL_DID_CREATE_ELEMENT.apply(this, arguments);
                let { args } = bucket;

                if (lte('2.15.0-beta.1')) {
                  args = args.namedArgs;
                }

                // on < 2.15 `namedArgs` is only present when there were arguments
                if (args && args.has('__ANGLE_ATTRS__')) {
                  let attributeReferences = args.get('__ANGLE_ATTRS__').value();
                  for (let attributeName in attributeReferences) {
                    let attributeReference = attributeReferences[attributeName];

                    operations.addDynamicAttribute(
                      element,
                      attributeName,
                      attributeReference,
                      false,
                      null
                    );
                  }
                }
              };
            }

            return definition;
          };

          return environment;
        };

        return registry;
      },
    });
  } else {
    // Based heavily on https://github.com/mmun/ember-component-attributes
    Component.reopen({
      __ANGLE_ATTRS__: computed({
        set(key, value) {
          let { invocationAttributes, attrSplat } = value;

          let combinedAttributes = Ember.assign({}, invocationAttributes, attrSplat);

          if (this.tagName === '') {
            return combinedAttributes;
          }

          let attributes = Object.keys(combinedAttributes);
          let attributeBindingsOverride = [];

          for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];

            attributeBindingsOverride.push(`__ANGLE_ATTRS__.${attribute}:${attribute}`);
          }

          if (this.attributeBindings) {
            let attributeBindings = this.attributeBindings.filter(microsyntax => {
              // See https://github.com/emberjs/ember.js/blob/6a6f279df3b1a0979b5fd000bf49cd775c720f01/packages/ember-glimmer/lib/utils/bindings.js#L59-L73
              let colonIndex = microsyntax.indexOf(':');
              let attribute =
                colonIndex === -1 ? microsyntax : microsyntax.substring(colonIndex + 1);

              return attributes.indexOf(attribute) === -1;
            });

            this.attributeBindings = attributeBindingsOverride.concat(attributeBindings);
          } else {
            this.attributeBindings = attributeBindingsOverride;
          }

          return combinedAttributes;
        },
      }),
    });
  }
})();

/* globals Ember */
/* eslint-disable ember/new-module-imports */
import { gte } from 'ember-compatibility-helpers';

// Based heavily on https://github.com/mmun/ember-component-attributes
(function() {
  const { Application, Component, computed, getOwner } = Ember;

  if (gte('3.2.0-beta.1')) {
    const P = Ember.__loader.require('container').privatize;
    const { combineTagged } = Ember.__loader.require('@glimmer/reference');
    const { clientBuilder } = Ember.__loader.require('@glimmer/runtime');

    Application.reopenClass({
      buildRegistry() {
        let registry = this._super(...arguments);
        let TemplateCompiler = registry.resolve(P`template-compiler:main`);
        let originalCreate = TemplateCompiler.create;

        TemplateCompiler.create = function(options) {
          let owner = getOwner(options);
          let compiler = originalCreate(...arguments);
          let compileTimeLookup = compiler.resolver;
          let runtimeResolver = compileTimeLookup.resolver;

          // setup our reference capture system
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

          runtimeResolver.builtInHelpers['-merge-refs'] = function(_vm, args) {
            let invocationReferences = args.named.has('invocation') && args.named.get('invocation');
            let splatReferences = args.named.has('splat') && args.named.get('splat').value();

            let references = {};

            if (invocationReferences) {
              for (let i = 0; i < invocationReferences.names.length; i++) {
                let name = invocationReferences.names[i];
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
          };

          // setup our custom attribute bindings directly from the references passed in
          let ORIGINAL_LOOKUP_COMPONENT_DEFINITION = runtimeResolver._lookupComponentDefinition;
          let installedCustomDidCreateElement = false;
          runtimeResolver._lookupComponentDefinition = function() {
            // call the original implementation
            let definition = ORIGINAL_LOOKUP_COMPONENT_DEFINITION.apply(this, arguments);

            if (!installedCustomDidCreateElement) {
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

          /*
            export interface ModifierManager<T = Modifier> {
                create(element: Element, args: IArguments, dynamicScope: DynamicScope, dom: DOMChanges): T;
                getTag(component: T): Tag;
                install(modifier: T): void;
                update(modifier: T): void;
                getDestructor(modifier: T): Option<Destroyable>;
            }
          */
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
              let attributeNames = Object.keys(invocationAttributes);
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

          return compiler;
        };

        return registry;
      },
    });
  } else {
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

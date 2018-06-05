/* globals Ember */
/* eslint-disable ember/new-module-imports */
import { gte } from 'ember-compatibility-helpers';

// Based heavily on https://github.com/mmun/ember-component-attributes
(function() {
  const { Application, Component, computed, getOwner } = Ember;

  if (gte('3.2.0-beta.1')) {
    const P = Ember.__loader.require('container').privatize;
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
              let domBuilder = owner.lookup('service:-dom-builder')(environment, {});
              domBuilder.constructing = element;

              let { positional, tag } = args.capture();

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
                  invocationAttributesReference.get(attributeName)
                );
              }

              return {
                dynamicAttributes,
                tag,
                dom,
                domBuilder,
                environment,
              };
            },

            getTag(bucket) {
              return bucket.tag;
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
  }

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
            let attribute = colonIndex === -1 ? microsyntax : microsyntax.substring(colonIndex + 1);

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
})();

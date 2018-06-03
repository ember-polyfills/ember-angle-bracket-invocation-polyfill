/* globals Ember */
/* eslint-disable ember/new-module-imports */

// Based heavily on https://github.com/mmun/ember-component-attributes
(function() {
    const { Component, computed } = Ember;

    Component.reopen({
      __ANGLE_ATTRS__: computed({
        set(key, value) {
          let attributes = Object.keys(value);
          let attributeBindingsOverride = [];

          for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];

            attributeBindingsOverride.push(`__ANGLE_ATTRS__.${attribute}:${attribute}`);
          }

          if (this.attributeBindings) {
            let attributeBindings = this.attributeBindings.filter(microsyntax => {
              // See https://github.com/emberjs/ember.js/blob/6a6f279df3b1a0979b5fd000bf49cd775c720f01/packages/ember-glimmer/lib/utils/bindings.js#L59-L73
              let colonIndex = microsyntax.indexOf(":");
              let attribute = colonIndex === -1 ? microsyntax : microsyntax.substring(colonIndex + 1);

              return attributes.indexOf(attribute) === -1;
            });

            this.attributeBindings = attributeBindingsOverride.concat(attributeBindings);
          } else {
            this.attributeBindings = attributeBindingsOverride;
          }

          return value;
        }
      })
    });
  })();
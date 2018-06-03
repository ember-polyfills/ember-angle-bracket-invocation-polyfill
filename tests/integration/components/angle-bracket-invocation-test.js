import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import Service, { inject as injectService } from '@ember/service';
import Component from '@ember/component';

module('Integration | Component | angle-bracket-invocation', function(hooks) {
  setupRenderingTest(hooks);

  module('static component support', function() {
    test('invoke without block', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`hi martin!`);

      await render(hbs`<FooBar />`);

      assert.dom().hasText('hi martin!');
    });

    test('invoke with block', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`{{yield}}`);

      await render(hbs`<FooBar>hi rwjblue!</FooBar>`);

      assert.dom().hasText('hi rwjblue!');
    });

    test('yielding block param', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`{{yield 'hi'}}`);

      await render(hbs`<FooBar as |salutation|>{{salutation}} rwjblue!</FooBar>`);

      assert.dom().hasText('hi rwjblue!');
    });

    test('with arguments', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<h2>{{title}}</h2>`);

      this.set('title', "rwjblue's component");
      await render(hbs`<FooBar @title={{title}} />`);

      assert.dom('h2').hasText("rwjblue's component");

      this.set('title', "mmun's component");
      assert.dom('h2').hasText("mmun's component");

      this.set('title', "rwjblue's component");
      assert.dom('h2').hasText("rwjblue's component");
    });

    test('with attributes', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs``);

      await render(hbs`<FooBar data-foo="bar" />`);

      assert.dom('[data-foo="bar"]').exists();
    });

    test('attributes, arguments, and block', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<h2>{{title}}</h2><p>{{yield}}</p>`);

      this.set('title', "rwjblue's component");
      await render(hbs`<FooBar data-foo="bar" @title={{title}}>Contents</FooBar>`);

      assert.dom('[data-foo="bar"]').exists();
      assert.dom('h2').hasText("rwjblue's component");
      assert.dom('p').hasText('Contents');
    });
  });

  module('dynamic component support', function() {
    test('invoke dynamic - local, self-closing', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar />
        {{/with}}
      `);

      assert.dom().hasText('hi rwjblue!');
    });

    test('invoke dynamic - local path', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`
        {{#with (hash here=(component 'foo-bar')) as |stuff|}}
          <stuff.here />
        {{/with}}
      `);

      assert.dom().hasText('hi rwjblue!');
    });

    test('invoke dynamic - local, block', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`{{yield}}!`);

      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar>hi rwjblue</LolBar>
        {{/with}}
      `);

      assert.dom().hasText('hi rwjblue!');
    });

    test('invoke dynamic - local, block, block param', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`{{yield 'hi'}}!`);

      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar as |salutation|>{{salutation}} rwjblue</LolBar>
        {{/with}}
      `);

      assert.dom().hasText('hi rwjblue!');
    });

    test('local with single attribute', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs``);

      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar data-foo="bar" />
        {{/with}}
      `);

      assert.dom('[data-foo="bar"]').exists();
    });

    test('invoke dynamic - path', async function(assert) {
      this.owner.register('service:elsewhere', Service.extend());
      this.owner.register(
        'component:x-invoker',
        Component.extend({
          elsewhere: injectService(),

          init() {
            this._super(...arguments);

            let elsewhere = this.get('elsewhere');
            elsewhere.set('curriedThing', this.curriedThing);
          },
        })
      );
      this.owner.register('template:components/x-invoker', hbs`<this.elsewhere.curriedThing />`);
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`{{x-invoker curriedThing=(component 'foo-bar')}}`);

      assert.dom().hasText('hi rwjblue!');
    });

    test('invoke dynamic - path no implicit this', async function(assert) {
      this.owner.register('service:elsewhere', Service.extend());
      this.owner.register(
        'component:x-invoker',
        Component.extend({
          elsewhere: injectService(),

          init() {
            this._super(...arguments);

            let elsewhere = this.get('elsewhere');
            elsewhere.set('curriedThing', this.curriedThing);
          },
        })
      );
      this.owner.register('template:components/x-invoker', hbs`<elsewhere.curriedThing />`);
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`{{x-invoker curriedThing=(component 'foo-bar')}}`);

      // should not have rendered anything (no implicit `this`)
      assert.dom().hasText('');
    });
  });

  module('has-block', function(hooks) {
    hooks.beforeEach(function() {
      this.owner.register('template:components/foo-bar', hbs`{{#if hasBlock}}Yes{{else}}No{{/if}}`);
    });

    test('when self-closing', async function(assert) {
      await render(hbs`<FooBar />`);

      assert.dom().hasText('No');
    });

    test('with block', async function(assert) {
      await render(hbs`<FooBar>Stuff</FooBar>`);

      assert.dom().hasText('Yes');
    });

    test('invoking dynamically - self-closing', async function(assert) {
      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar />
        {{/with}}
      `);

      assert.dom().hasText('No');
    });

    test('invoking dynamically - with block', async function(assert) {
      await render(hbs`
        {{#with (component 'foo-bar') as |LolBar|}}
          <LolBar></LolBar>
        {{/with}}
      `);

      assert.dom().hasText('Yes');
    });
  });
});

import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import Service, { inject as injectService } from '@ember/service';
import Component from '@ember/component';

module('Integration | Component | angle-bracket-invocation', function(hooks) {
  setupRenderingTest(hooks);

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

  test('with single argument', async function(assert) {
    this.owner.register('template:components/foo-bar', hbs`<h2>{{title}}</h2>`);

    this.set('title', "rwjblue's component");
    await render(hbs`<FooBar @title={{title}} />`);
 
    assert.dom('h2').hasText("rwjblue's component");
  });

  test('invoke dynamic - local', async function(assert) {
    this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

    await render(hbs`
      {{#with (component 'foo-bar') as |LolBar|}}
        <LolBar />
      {{/with}}
    `);
 
    assert.dom().hasText("hi rwjblue!");
  });

  test('invoke dynamic - path', async function(assert) {
    this.owner.register('service:elsewhere', Service.extend());
    this.owner.register('component:x-invoker', Component.extend({
      elsewhere: injectService(),

      init() {
        this._super(...arguments);

        let elsewhere = this.get('elsewhere');
        elsewhere.set('curriedThing', this.curriedThing);
      }
    }));
    this.owner.register('template:components/x-invoker', hbs`<elsewhere.curriedThing />`);
    this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

    await render(hbs`{{x-invoker curriedThing=(component 'foo-bar')}}`);

    assert.dom().hasText("hi rwjblue!");
  });
});
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

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

  test('invoke dynamic path', async function(assert) {
    this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

    await render(hbs`
      {{#with (component 'foo-bar') as |LolBar}}
        <LolBar />
      {{/with}}
    `);
 
    assert.dom('h2').hasText("rwjblue's component");
  });
});
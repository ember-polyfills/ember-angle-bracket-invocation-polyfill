import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberRouter from '@ember/routing/router';
import EmberObject from '@ember/object';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';

const isUsingAngleBracketPolyfill = !hasEmberVersion(3, 4);

module('Integration | Component | link-to', function(hooks) {
  const Router = EmberRouter.extend();
  Router.map(function() {
    this.route('foo');
    this.route('bar', { path: '/bar/:bar_id' }, function() {
      this.route('sub', { path: '/sub/:sub_id' });
    });
  });

  const modelA = EmberObject.create({
    id: '1',
  });
  const modelB = EmberObject.create({
    id: '2',
  });

  setupRenderingTest(hooks);
  hooks.beforeEach(function() {
    this.owner.register('router:main', Router);
    this.owner.setupRouter();
    this.setProperties({
      modelA,
      modelB,
    });
  });

  test('it supports static route', async function(assert) {
    await render(hbs`<LinkTo @route="foo" class="main">Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/foo');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports static route with class property', async function(assert) {
    await render(hbs`
    {{#with (concat "ma" "in") as |main|}}
      <LinkTo @route="foo" class={{main}}>Link</LinkTo>
    {{/with}}
    `);

    assert.dom('a').hasAttribute('href', '#/foo');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports static route with dynamic class', async function(assert) {
    await render(hbs`<LinkTo @route="foo" class={{concat "ma" "in"}}>Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/foo');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports static route with class concat statement', async function(assert) {
    await render(hbs`<LinkTo @route="foo" class="ma{{"in"}}">Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/foo');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports dynamic route', async function(assert) {
    await render(hbs`<LinkTo @route="bar" @model={{this.modelA}} class="main">Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/bar/1');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports dynamic route w/ multiple models', async function(assert) {
    this.set('models', [this.modelA, this.modelB]);
    await render(hbs`<LinkTo @route="bar.sub" @models={{this.models}} class="main">Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/bar/1/sub/2');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports dynamic route w/ multiple models and array helper', async function(assert) {
    this.set('models', [this.modelA, this.modelB]);
    await render(
      hbs`<LinkTo @route="bar.sub" @models={{array this.modelA this.modelB}} class="main">Link</LinkTo>`
    );

    assert.dom('a').hasAttribute('href', '#/bar/1/sub/2');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports query params', async function(assert) {
    this.set('query', {
      q1: 1,
      q2: 'some',
      q3: 'value',
    });
    await render(hbs`<LinkTo @route="foo" @query={{this.query}} class="main">Link</LinkTo>`);

    assert.dom('a').hasAttribute('href', '#/foo?q1=1&q2=some&q3=value');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it supports query params w/ hash helper', async function(assert) {
    this.set('q3', 'value');
    await render(
      hbs`<LinkTo @route="foo" @query={{hash q1=1 q2="some" q3=this.q3}} class="main">Link</LinkTo>`
    );

    assert.dom('a').hasAttribute('href', '#/foo?q1=1&q2=some&q3=value');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasText('Link');
  });

  test('it passes supported properties and attributes', async function(assert) {
    this.owner.startRouting();

    await render(
      hbs`<LinkTo @route="index" @activeClass="act" class="main" id="test" role="nav" rel="noopener" tabindex="1" title="something" target="_blank">Link</LinkTo>`
    );
    assert.dom('a').hasAttribute('href', '#/');
    assert.dom('a').hasClass('act');
    assert.dom('a').hasClass('main');
    assert.dom('a').hasAttribute('id', 'test');
    assert.dom('a').hasAttribute('role', 'nav');
    assert.dom('a').doesNotHaveAttribute('ariaRole', 'nav'); // Ensure the internal mapping from role->ariaRole results in the correct attribute
    assert.dom('a').hasAttribute('rel', 'noopener');
    assert.dom('a').hasAttribute('tabindex', '1');
    assert.dom('a').hasAttribute('title', 'something');
    assert.dom('a').hasAttribute('target', '_blank');
    assert.dom('a').hasText('Link');
  });

  test('it ignores handlebars comments', async function(assert) {
    await render(hbs`<LinkTo @route="foo" {{! template-lint-disable-tree }} />`);

    assert.dom('a').exists();
  });

  test('it supports unknown attributes', async function(assert) {
    await render(hbs`<LinkTo @route="foo" aria-labelledby="foo" data-test-foo data-foo-bar="stuff" />`);

    assert.dom('a').exists();
    assert.dom('a').hasAttribute('data-test-foo');
    assert.dom('a').hasAttribute('data-foo-bar', 'stuff');
  });

  module('...attributes', function() {
    test('no additional attributes', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<LinkTo @route="foo" ...attributes />`);

      await render(hbs`<FooBar data-test-foo />`);

      assert.dom('a').hasAttribute('data-test-foo');
    });

    test('with additional attributes', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<LinkTo @route="foo" data-one="from inner" data-two="from inner" ...attributes />`);

      await render(hbs`<FooBar data-one="from outer" />`);

      assert.dom('a').hasAttribute('data-one', 'from outer');
      assert.dom('a').hasAttribute('data-two', 'from inner');
    });

    test('unused', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<LinkTo @route="foo" ...attributes />`);

      await render(hbs`<FooBar />`);

      assert.dom('a').exists();
      assert.dom('a').hasAttribute('href', '#/foo');
    });

    test('merge class names', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<LinkTo @route="foo" class={{@inside}} ...attributes />`);

      this.outside = 'new';
      this.inside = 'original';
      await render(hbs`<FooBar @inside={{this.inside}} class={{this.outside}} />`);

      assert.dom('a').hasClass('original');
      assert.dom('a').hasClass('new');

      this.set('outside', undefined);
      await settled();
      assert.dom('a').hasClass('original');
      assert.dom('a').doesNotHaveClass('new');

      this.set('outside', 'OUT');
      this.set('inside', undefined);
      await settled();
      assert.dom('a').hasClass('OUT');
      assert.dom('a').doesNotHaveClass('new');
      assert.dom('a').doesNotHaveClass('original');

      this.set('inside', 'IN');
      await settled();
      assert.dom('a').hasClass('OUT');
      assert.dom('a').hasClass('IN');
    });

    test('unused with attributes present', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<LinkTo @route="foo" data-one="from inner" ...attributes />`);

      await render(hbs`<FooBar />`);

      assert.dom('a').hasAttribute('data-one', 'from inner');
    });

    // This was broken in Ember until 3.10+, see
    // https://github.com/emberjs/ember.js/pull/17533. So we only test in
    // versions where these tests have a chance to pass...
    if (isUsingAngleBracketPolyfill || hasEmberVersion(3, 9)) {
      test('merges attributes in correct priority', async function(assert) {
        this.owner.register(
          'template:components/foo-bar',
          hbs`<LinkTo @route="foo" data-left="left inner" ...attributes data-right="right inner"/>`
        );
        await render(hbs`<FooBar data-left="left outer" data-right="right outer" />`);

        assert.dom('a').hasAttribute('data-left', 'left outer');
        assert.dom('a').hasAttribute('data-right', 'right inner');
      });
    }
  });
});

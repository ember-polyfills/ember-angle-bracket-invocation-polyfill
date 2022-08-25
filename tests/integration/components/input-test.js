import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';

const isUsingAngleBracketPolyfill = !hasEmberVersion(3, 4);

module('Integration | Component | input', function(hooks) {
  setupRenderingTest(hooks);

  test('it supports text field', async function(assert) {
    this.set('value', 'foo');
    await render(hbs`<Input @type="text" @value={{this.value}} />`);

    assert.dom('input').hasAttribute('type', 'text');
    assert.dom('input').hasValue('foo');
  });

  test('it supports different input types', async function(assert) {
    this.set('value', 'user@example.com');
    await render(hbs`<Input @type="email" @value={{this.value}} />`);

    assert.dom('input').hasAttribute('type', 'email');
    assert.dom('input').hasValue('user@example.com');
  });

  test('it supports checkbox', async function(assert) {
    this.set('value', true);
    await render(hbs`<Input @type="checkbox" @checked={{this.value}} />`);

    assert.dom('input').hasAttribute('type', 'checkbox');
    assert.dom('input').isChecked();
  });

  test('it supports textarea', async function(assert) {
    this.set('value', 'foo bar');
    await render(hbs`<Textarea @value={{this.value}} />`);

    assert.dom('textarea').exists();
    assert.dom('textarea').hasValue('foo bar');
  });

  test('it passes supported properties and attributes', async function(assert) {
    await render(
      hbs`<Input
        @value="foo"
        @size="20"
        name="username"
        placeholder="Enter username"
        class="form-input"
        role="searchbox"
      />`
    );

    // does not test each and every supported property / HTML attribute, as the list is rather long, and the transform
    // will just pass anything through, so either all work or no one does.
    assert.dom('input').hasAttribute('type', 'text');
    assert.dom('input').hasValue('foo');
    assert.dom('input').hasAttribute('name', 'username');
    assert.dom('input').hasAttribute('placeholder', 'Enter username');
    assert.dom('input').hasClass('form-input');
    assert.dom('input').hasAttribute('role', 'searchbox');
  });

  test('it ignores handlebars comments', async function(assert) {
    await render(hbs`<Input {{! template-lint-disable-tree }} />`);

    assert.dom('input').exists();
  });

  test('it supports unknown attributes', async function(assert) {
    await render(hbs`<Input aria-labelledby="foo" data-test-foo data-foo-bar="stuff" />`);

    assert.dom('input').exists();
    assert.dom('input').hasAttribute('data-test-foo');
    assert.dom('input').hasAttribute('data-foo-bar', 'stuff');
  });

  test('it passes <input> untouched', async function(assert) {
    await render(hbs`<input />`);

    assert.dom('input').exists();
    assert.dom('input').doesNotHaveClass('ember-view');
  });

  module('...attributes', function() {
    test('no additional attributes', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<Input ...attributes />`);

      await render(hbs`<FooBar data-test-foo />`);

      assert.dom('input').hasAttribute('data-test-foo');
    });

    test('with additional attributes', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<Input data-one="from inner" data-two="from inner" ...attributes />`);

      await render(hbs`<FooBar data-one="from outer" />`);

      assert.dom('input').hasAttribute('data-one', 'from outer');
      assert.dom('input').hasAttribute('data-two', 'from inner');
    });

    test('unused', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<Input ...attributes />`);

      await render(hbs`<FooBar />`);

      assert.dom('input').exists();
    });

    test('merge class names', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<Input class={{@inside}} ...attributes />`);

      this.outside = 'new';
      this.inside = 'original';
      await render(hbs`<FooBar @inside={{this.inside}} class={{this.outside}} />`);

      assert.dom('input').hasClass('original');
      assert.dom('input').hasClass('new');

      this.set('outside', undefined);
      await settled();
      assert.dom('input').hasClass('original');
      assert.dom('input').doesNotHaveClass('new');

      this.set('outside', 'OUT');
      this.set('inside', undefined);
      await settled();
      assert.dom('input').hasClass('OUT');
      assert.dom('input').doesNotHaveClass('new');
      assert.dom('input').doesNotHaveClass('original');

      this.set('inside', 'IN');
      await settled();
      assert.dom('input').hasClass('OUT');
      assert.dom('input').hasClass('IN');
    });

    test('unused with attributes present', async function(assert) {
      this.owner.register('template:components/foo-bar', hbs`<Input data-one="from inner" ...attributes />`);

      await render(hbs`<FooBar />`);

      assert.dom('input').hasAttribute('data-one', 'from inner');
    });

    // This was broken in Ember until 3.10+, see
    // https://github.com/emberjs/ember.js/pull/17533. So we only test in
    // versions where these tests have a chance to pass...
    if (isUsingAngleBracketPolyfill || hasEmberVersion(3, 9)) {
      test('merges attributes in correct priority', async function(assert) {
        this.owner.register(
          'template:components/foo-bar',
          hbs`<Input data-left="left inner" ...attributes data-right="right inner"/>`
        );
        await render(hbs`<FooBar data-left="left outer" data-right="right outer" />`);

        assert.dom('input').hasAttribute('data-left', 'left outer');
        assert.dom('input').hasAttribute('data-right', 'right inner');
      });
    }
  });
});

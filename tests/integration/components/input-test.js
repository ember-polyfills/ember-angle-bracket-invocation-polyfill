import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

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

  test('it ignores unknown attributes', async function(assert) {
    await render(hbs`<Input aria-labelledby="foo" data-test-foo data-foo-bar="stuff" />`);

    assert.dom('input').exists();
    assert.dom('a').hasAttribute('data-test-foo');
    assert.dom('a').hasAttribute('data-foo-bar', 'stuff');
  });

  test('it passes <input> untouched', async function(assert) {
    await render(hbs`<input />`);

    assert.dom('input').exists();
    assert.dom('input').doesNotHaveClass('ember-view');
  });
});

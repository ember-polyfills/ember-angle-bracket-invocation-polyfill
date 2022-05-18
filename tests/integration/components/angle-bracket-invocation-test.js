import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import Service, { inject as injectService } from '@ember/service';
import { helper as buildHelper } from '@ember/component/helper';
import Component from '@ember/component';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';

const isUsingAngleBracketPolyfill = !hasEmberVersion(3, 4);

module('Integration | Component | angle-bracket-invocation', function(hooks) {
  setupRenderingTest(hooks);

  module('static component support', function() {
    test('does not affect helper usage', async function(assert) {
      this.owner.register('helper:my-helper', buildHelper(() => 'my-helper'));

      await render(hbs`{{my-helper}}`);

      assert.dom().hasText('my-helper');
    });

    test('does not error when using with synthetic elements (GH#31)', async function(assert) {
      await render(hbs`{{fa-icon "camera"}}`);

      assert.dom('i').hasClass('fa-camera');
    });

    test('single word components', async function(assert) {
      this.owner.register('template:components/foo', hbs`hi martin!`);

      await render(hbs`<Foo />`);

      assert.dom().hasText('hi martin!');
    });

    test('multiline component invocation using windows line endings without spaces after open element (GH#40)', async function(assert) {
      this.owner.register('template:components/foo', hbs`hi martin!`);

      await render(hbs`<Foo\r\n  @blah="thing"\r\n></Foo>`);
      assert.dom().hasText('hi martin!');
    });

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

    test('yielding block param to nested child component using each-in', async function(assert) {
      class ParentClazz extends Component {
        get restaurants() {
          return {
            1: {
              name: 'one',
            },
            2: {
              name: 'two',
            },
          };
        }
        get layout() {
          return hbs`{{yield restaurants}}`;
        }
      }

      this.owner.register('component:the-parent', ParentClazz);
      this.owner.register(
        'template:components/the-child',
        hbs`{{#each-in this.restaurants as |key item|}}<h1>{{item.name}}</h1>{{/each-in}}`
      );

      await render(
        hbs`<TheParent as |restaurants|><TheChild @restaurants={{restaurants}} /></TheParent>`
      );

      assert.dom('h1:nth-of-type(1)').hasText('one');
      assert.dom('h1:nth-of-type(2)').hasText('two');
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

    test('nested paths do not conflict with non-nested paths with similar names', async function(assert) {
      this.owner.register('template:components/foo/bar', hbs`hi rwjblue!`);
      this.owner.register('template:components/foo-bar', hbs`hi rtablada!`);

      await render(hbs`
        <Foo::Bar data-foo="bar"/>
        <FooBar data-foo="baz" />
      `);

      assert.dom('[data-foo="bar"]').hasText('hi rwjblue!');
      assert.dom('[data-foo="baz"]').hasText('hi rtablada!');
    });

    test('invoke nested path', async function(assert) {
      this.owner.register('template:components/foo/bar', hbs`hi rwjblue!`);

      await render(hbs`
        <Foo::Bar data-foo="bar"/>
      `);

      assert.dom('[data-foo="bar"]').exists();
    });

    test('invoke deeply nested path', async function(assert) {
      this.owner.register('template:components/foo/bar/baz/qux', hbs`hi rwjblue!`);

      await render(hbs`
        <Foo::Bar::Baz::Qux data-foo="bar"/>
      `);

      assert.dom('[data-foo="bar"]').exists();
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

    test('invoke dynamic - named arguments', async function(assert) {
      this.owner.register('template:components/x-invoker', hbs`<@curriedThing />`);
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`{{x-invoker curriedThing=(component 'foo-bar')}}`);

      assert.dom().hasText('hi rwjblue!');
    });

    test('invoke dynamic - named argument paths', async function(assert) {
      this.owner.register('template:components/x-invoker', hbs`<@stuff.curriedThing />`);
      this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

      await render(hbs`{{x-invoker stuff=(hash curriedThing=(component 'foo-bar'))}}`);

      assert.dom().hasText('hi rwjblue!');
    });

    // The following test is commented out because the template does not even compile in modern Embers
    // with the error "You used elsewhere.curriedThing as a tag name, but elsewhere is not in scope".
    // This test can be uncommented once it can be conditionally run only in older Embers.
    //
    // test('invoke dynamic - path no implicit this', async function(assert) {
    //   this.owner.register('service:elsewhere', Service.extend());
    //   this.owner.register(
    //     'component:x-invoker',
    //     Component.extend({
    //       elsewhere: injectService(),

    //       init() {
    //         this._super(...arguments);

    //         let elsewhere = this.get('elsewhere');
    //         elsewhere.set('curriedThing', this.curriedThing);
    //       },
    //     })
    //   );
    //   this.owner.register('template:components/x-invoker', hbs`<elsewhere.curriedThing />`);
    //   this.owner.register('template:components/foo-bar', hbs`hi rwjblue!`);

    //   await render(hbs`{{x-invoker curriedThing=(component 'foo-bar')}}`);

    //   // should not have rendered anything (no implicit `this`)
    //   assert.dom().hasText('');
    // });
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

  module('...attributes', function() {
    test('passing into angle invocation - no additional attributes', async function(assert) {
      this.owner.register('template:components/comp-outer', hbs`<CompInner ...attributes />`);
      this.owner.register('template:components/comp-inner', hbs`hi martin!`);

      await render(hbs`<CompOuter data-test-foo />`);

      assert.dom('[data-test-foo]').hasText('hi martin!');
    });

    test('passing into angle invocation - with additional attributes', async function(assert) {
      this.owner.register(
        'template:components/comp-outer',
        hbs`<CompInner data-one="from outer" data-two="from outer" ...attributes />`
      );
      this.owner.register('template:components/comp-inner', hbs`hi martin!`);

      await render(hbs`<CompOuter data-one="from render" />`);

      assert.dom('[data-one="from render"][data-two="from outer"]').hasText('hi martin!');
    });

    test('passing into angle invocation - unused', async function(assert) {
      this.owner.register('template:components/comp-outer', hbs`<CompInner ...attributes />`);
      this.owner.register('template:components/comp-inner', hbs`hi martin!`);

      await render(hbs`<CompOuter />`);

      assert.dom('div div').hasText('hi martin!');
    });

    test('passing into element - normal component', async function(assert) {
      this.owner.register(
        'template:components/foo-bar',
        hbs`<span ...attributes>hi martin!</span>`
      );

      await render(hbs`<FooBar data-test-my-thing />`);

      assert.dom('span[data-test-my-thing]').hasText('hi martin!');
    });

    test('passing into element - tagless component', async function(assert) {
      this.owner.register(
        'template:components/foo-bar',
        hbs`<span ...attributes>hi martin!</span>`
      );
      this.owner.register('component:foo-bar', Component.extend({ tagName: '' }));

      await render(hbs`<FooBar data-test-my-thing />`);

      assert.dom('span[data-test-my-thing]').hasText('hi martin!');
    });

    test('merge class names on element', async function(assert) {
      this.owner.register(
        'template:components/foo-bar',
        hbs`<span class={{@inside}} ...attributes></span>`
      );

      this.outside = 'new';
      this.inside = 'original';
      await render(hbs`<FooBar @inside={{this.inside}} class={{this.outside}} />`);

      assert.dom('span').hasClass('original');
      assert.dom('span').hasClass('new');

      this.set('outside', undefined);
      await settled();
      assert.dom('span').hasClass('original');
      assert.dom('span').doesNotHaveClass('new');

      this.set('outside', 'OUT');
      this.set('inside', undefined);
      await settled();
      assert.dom('span').hasClass('OUT');
      assert.dom('span').doesNotHaveClass('new');
      assert.dom('span').doesNotHaveClass('original');

      this.set('inside', 'IN');
      await settled();
      assert.dom('span').hasClass('OUT');
      assert.dom('span').hasClass('IN');
    });

    test('merge class names on component', async function(assert) {
      this.owner.register('template:components/span', hbs`<span ...attributes></span>`);
      this.owner.register(
        'template:components/foo-bar',
        hbs`<Span class={{@inside}} ...attributes></Span>`
      );

      this.outside = 'new';
      this.inside = 'original';
      await render(hbs`<FooBar @inside={{this.inside}} class={{this.outside}} />`);

      assert.dom('span').hasClass('original');
      assert.dom('span').hasClass('new');

      this.set('outside', undefined);
      await settled();
      assert.dom('span').hasClass('original');
      assert.dom('span').doesNotHaveClass('new');

      this.set('outside', 'OUT');
      this.set('inside', undefined);
      await settled();
      assert.dom('span').hasClass('OUT');
      assert.dom('span').doesNotHaveClass('new');
      assert.dom('span').doesNotHaveClass('original');

      this.set('inside', 'IN');
      await settled();
      assert.dom('span').hasClass('OUT');
      assert.dom('span').hasClass('IN');
    });

    test('passing into element - unused', async function(assert) {
      this.owner.register(
        'template:components/foo-bar',
        hbs`<span ...attributes>hi martin!</span>`
      );

      await render(hbs`<FooBar />`);

      assert.dom('span').hasText('hi martin!');
    });

    test('passing into element - unused with attributes present', async function(assert) {
      this.owner.register(
        'template:components/foo-bar',
        hbs`<span class="hello" ...attributes>hi martin!</span>`
      );

      await render(hbs`<FooBar />`);

      assert.dom('span').hasText('hi martin!');
    });

    // This was broken in Ember until 3.10+, see
    // https://github.com/emberjs/ember.js/pull/17533. So we only test in
    // versions where these tests have a chance to pass...
    if (isUsingAngleBracketPolyfill || hasEmberVersion(3, 9)) {
      test('merges attributes in correct priority', async function(assert) {
        this.owner.register(
          'template:components/foo-bar',
          hbs`<span data-left="left-inner" ...attributes data-right="right-inner"></span>`
        );
        await render(hbs`<FooBar data-left="left-outer" data-right="right-outer" />`);

        assert.dom('span').hasAttribute('data-left', 'left-outer');
        assert.dom('span').hasAttribute('data-right', 'right-inner');
      });
    }
  });
});

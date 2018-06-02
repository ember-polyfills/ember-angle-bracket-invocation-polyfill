- docs:
  - feature: link to rfc, brief explanation, usage examples
  - limitations:
    - no support for explicit ...attributes at all
    - must still have two words
    - self closing detection is dependent on ember 3.1+

- tests:
  - all integration? or some ast transform tests
  - <FooBar />

  - <FooBar x=1 /> -> {{foo-bar (-html-attrs x=1)}}
  - <@FooBar x=1 /> -> {{component @FooBar (-html-attrs x=1)}}
  - <FooBar x=1 @blah="derp" /> -> {{foo-bar (-html-attrs x=1) blah="derp"}}
  - <FooBar x=1 @blah={{derp}} /> -> {{foo-bar (-html-attrs x=1) blah=derp}}
  - <FooBar as |lol|>
      stuff here...
        <lol></lol>
    </FooBar>

    ->

    {{#foo-bar as |lol|}}
      stuff here...
        {{component lol}}
    {{/foo-bar}}
 - <f.text-area />

impl:
  - find all elements
  - check if 1) they are a local path, or
             2) they start with a capital letter
  - if 1), then replace with {{component}}
  - if 2), then replace with {{camel-case-name}}
  - make sure that has-block is correct for `<FooBar />` in both cases
  - noop when on Ember 3.4+


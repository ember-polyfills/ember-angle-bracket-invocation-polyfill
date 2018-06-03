ember-angle-bracket-invocation-polyfill
==============================================================================

This addon provides a polyfill for angle bracket invocation syntax as described in
[RFC 311](https://github.com/emberjs/rfcs/pull/311). It's the same components you
know and love, no longer surrounded by mustaches. \o/

[![Build Status](https://travis-ci.org/rwjblue/ember-angle-bracket-invocation-polyfill.svg?branch=master)](https://travis-ci.org/rwjblue/ember-angle-bracket-invocation-polyfill)

Installation
------------------------------------------------------------------------------

```
ember install ember-angle-bracket-invocation-polyfill
```

Usage
------------------------------------------------------------------------------

The best usage guide is [the RFC itself](https://github.com/emberjs/rfcs/blob/master/text/0311-angle-bracket-invocation.md),
but here are a few examples of "before"/"after" to whet your appetite:

### Before:

```hbs
{{site-header user=this.user class=(if this.user.isAdmin "admin")}}

{{#super-select selected=this.user.country as |s|}}
  {{#each this.availableCountries as |country|}}
    {{#s.option value=country}}{{country.name}}{{/s.option}}
  {{/each}}
{{/super-select}}

```

### After:

```hbs
<SiteHeader @user={{this.user}} class={{if this.user.isAdmin "admin"}} />

<SuperSelect @selected={{this.user.country}} as |Option|>
  {{#each this.availableCountries as |country|}}
    <Option @value={{country}}>{{country.name}}</Option>
  {{/each}}
</SuperSelect>
```

Limitations
------------------------------------------------------------------------------

Not all features described in the RFC are polyfilled.
This addon does not support the following features:

- Single word component names
- Explicitly splatting attributes with `...attributes`.


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd ember-angle-bracket-invocation-polyfill`
* `yarn install`

### Linting

* `yarn lint:js`
* `yarn lint:js --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).

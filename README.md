ember-angle-bracket-invocation-polyfill
==============================================================================

This addon provides a polyfill for angle bracket invocation syntax as described in
[RFC 311](https://github.com/emberjs/rfcs/pull/311).

Installation
------------------------------------------------------------------------------

```
ember install ember-angle-bracket-invocation-polyfill
```


Usage
------------------------------------------------------------------------------

Simply invoke


Limitations
------------------------------------------------------------------------------

Not all features described in the RFC are polyfilled.
This addon does not support the follow features:

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

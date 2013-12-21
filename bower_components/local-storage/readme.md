# LocalStorage.js #

Simple `window.localStorage` abstraction wrapper

[![Build Status](https://travis-ci.org/mwager/LocalStorage.png?branch=master)](https://travis-ci.org/mwager/LocalStorage)

## Installation ##

### Via bower  ###

Add this to your `bower.json`:

    "LocalStorage": "https://raw.github.com/mwager/LocalStorage/master/src/LocalStorage.js"

Then execute:

    $ bower install

### From source  ###

    $ git clone https://github.com/mwager/LocalStorage
    $ npm install && bower install
    # -> src/LocalStorage.js

    # run the tests
    $ grunt test
    # or:
    $ open test/index.html


## Usage ##

The API is *very* simple, `window.localStorage`'s exceptions will be
propagated.

There are 4 public methods:

* `get(key)`
* `save(key, data)`
* `delete(key)`
* `nuke()`

### Examples ###

```javascript

// Initializing throws an exception if one of the following is true:
//  - localStorage is not supported in the running environment
//  - `window.JSON` is not defined
var ls = new LocalStorage();
var obj;

// persist:
try {
    ls.save('some-key', {foo:'bar'});
}
catch(e) {
    // localStorage exception, eg. e.name === 'QuotaExceededError'
    console.log(e);
}

// read:
obj = ls.get('some-key');

console.log(typeof obj); // 'object' -> {foo:'bar'}

// delete:
ls.delete('some-key');

obj = ls.get('some-key'); // null

// clear localStorage:
ls.nuke();
```

## Code Quality ##

    # We use jshint for static analysis, execute:
    $ jshint .

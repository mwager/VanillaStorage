# VanillaStorage.js #

[![Build Status](https://travis-ci.org/mwager/VanillaStorage.png?branch=master)](https://travis-ci.org/mwager/VanillaStorage)

[Run the tests in your browser](http://mwager.github.io/VanillaStorage/test/)

[Watch the tests on saucelabs](https://saucelabs.com/u/mwager)

Simple key/value based storage abstraction lib for usage in browser based environments. Uses IndexedDB with fallback to [deprecated but still widely supported and needed] WebSQL. If also WebSQL is not available (eg IE <= 9) it will fallback to `window.localStorage`.

## Demo ##

[JSFiddle](http://jsfiddle.net/G8h2V/9/) (Use chrome dev tools to inspect the stored IndexedDB data)

## Installation ##

### Via bower  ###

    $ bower info vanilla-storage
    $ bower install vanilla-storage

### From source  ###

    $ git clone https://github.com/mwager/VanillaStorage.git
    $ cd VanillaStorage
    $ npm install && bower install
    $ grunt test

### Optimized source ###

See `dist/vanilla-storage.js`, or if you want to build it yourself:

    $ grunt build # creates dist/vanilla-storage.js for production usage

### Dependencies ###

* [LocalStorage.js](https://github.com/mwager/LocalStorage)


### Global vs. AMD ###

Either include the files via script tags:

```html
<script src="path/to/vanilla-storage/src/storageHelpers.js"></script>
<script src="path/to/LocalStorage/src/LocalStorage.js"></script>
<script src="path/to/vanilla-storage/src/WebSQLStorage.js"></script>
<script src="path/to/vanilla-storage/src/IDBStorage.js"></script>
<script src="path/to/vanilla-storage/src/VanillaStorage.js"></script>
```

...or add something like the following to your requirejs config:

```javascript
...
    paths: {
        VanillaStorage: 'path/to/src/VanillaStorage',
        LocalStorage:   'path/to/LocalStorage/src/LocalStorage',
        WebSQLStorage:  'path/to/src/WebSQLStorage',
        IDBStorage:     'path/to/src/IDBStorage',
        storageHelpers: 'path/to/src/storageHelpers'
    },
...
```


## Usage ##

The API is all async and pretty simple, there are 4 public methods:

* `get(key, fn)`
* `save(key, data, fn)`
* `drop(key, fn)`
* `nuke(fn)`

Callback functions always have the error as first parameter, data as second if any. So if the first parameter of a callback is `undefined` it means the operation was successful.

### Examples ###

#### Default usage ####

```javascript
var options = {
        storeName: 'my_data_store', // name of the store ("name of database")
        version: '1.0' // string for websql, on idb we parseInt
    },
    vanilla,
    KEY       = 'some-key',
    DEMO_DATA = {foo: 'bar', num:42};

// vanilla api ready to use
var readyToUseAPI = function(err) {
    console.log(err, this); // -> this instanceof VanillaStorage

    this.save(KEY, DEMO_DATA, function _saved(err) {
        console.log(err); // should be undefined

        vanilla.get(KEY, function _fetched(err, data) {
            console.log(data); // -> DEMO_DATA

            vanilla.drop(KEY, function _deleted_(err) {
                // calling get(KEY) now should have the error passed with message not found
            });
        });
    });
};

// pre-checks possible:
console.log(VanillaStorage.isValid('websql-storage'))
console.log(VanillaStorage.isValid('indexeddb-storage'))

// NOTE: you must provide a `ready`-calback
vanilla = new VanillaStorage(options, readyToUseAPI);
```

### Standalone usage  ###

```javascript
// you can also use the adapters standalone
var wsql = new WebSQLStorage();
console.log(wsql.isValid());

wsql.init(function ready(err) {
    if(!err) {
        wsql.save('some-key', {foo:'bar'}, function __saved(err, data) {
            console.log(err, data);
        });
        // ...
    }
});

var idb = new IDBStorage();
if(idb.isValid()) {
    idb.init(function ready(err) {
        if(!err) {
            idb.save('some-key', {foo:'bar'}, function __saved(err, data) {
                console.log(err, data);
            });
            // ...
        }
    });
}
```

### Testing ###

    $ grunt test

    # or:
    $ grunt test-server&
    $ phantomjs --debug=false --local-storage-path=. --local-storage-quota=100000000000??? ./node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee http://localhost:1234/test

Run the suite in real browsers via `testem`:

    $ grunt testem



## TODOs ##
* search the repo for `TODO`...
* figure out way to store more data using phantomjs. increase in storageTest, see TODO. or only on browsers? testem etc...

    $ grunt test-server &
    $ phantomjs --help # -> --local-storage-quota=<val in KB> ...

    ---> but smt like the following fails with more than ~4MB..
    $ phantomjs --debug=false --local-storage-path=. --local-storage-quota=100000000000??? ./node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee http://localhost:1234/test

    $ grunt test #fails too if too much data..

* more options: pass db name and version, ...
* create more advanced tests in more browsers

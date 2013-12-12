# VanillaStorage.js #

[![Build Status](https://travis-ci.org/mwager/VanillaStorage.png?branch=master)](https://travis-ci.org/mwager/VanillaStorage)

WORK IN PROGRESS, check all TODOs !!!

Simple key/value based storage abstraction lib for usage in browser based environments. Uses IndexedDB with fallback to [deprecated but still widely supported and needed] WebSQL.

## Installation ##

### Via bower  ###

    $ bower info vanilla-storage

### From source  ###

    $ git clone ...
    $ npm install && bower install
    $ jshint . # TODO
    $ grunt test
    $ grunt build . # TODO requirejs build for one file. just need a config.js somewhere!


Either include the files via script tags or add something like the following to your requirejs config:

```javascript
...
    paths: {
        VanillaStorage: 'path/to//src/VanillaStorage',
        WebSQLStorage:  'path/to//src/WebSQLStorage',
        IDBStorage:     'path/to//src/IDBStorage',
        storageHelpers: 'path/to//src/storageHelpers'
    },
...
```


## Usage ##

The API is all async and pretty simple, there are 4 public methods:

* `get(key, fn)`
* `save(key, data)`
* `delete(key)`
* `nuke()`

Callback functions always have the error as first parameter, data as second if any. So if the first parameter of a callback is `undefined` it means the operation was successful.

### Examples ###

#### Default usage ####

```javascript
// we need to set the name(s) of object store(s) before we init IndexedDB
var objectStoreNames = ['store1', 'store2'],
    vanilla,
    KEY       = objectStoreNames[0],
    DEMO_DATA = {foo: 'bar', num:42};

// vanilla api ready to use
// it uses IndexedDB or WebSQL under the hood
var readyToUseAPI = function(err) {
    console.log(err, this); // -> this instanceof VanillaStorage

    this.save(KEY, DEMO_DATA, function(err) {
        console.log(err); // should be undefined

        vanilla.get(KEY, function(err, data) {
            console.log(data); // -> DEMO_DATA

            vanilla.delete(KEY, function(err) {
                // calling get(KEY) now should have the error passed with message not found
            });
        });
    });
};

// pre-checks possible:
VanillaStorage.isValid('websql-storage')
VanillaStorage.isValid('indexeddb-storage')

// NOTE: you must provide a `ready`-calback
vanilla = new VanillaStorage({
    keys: objectStoreNames
}, readyToUseAPI);
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
idb.setKeys(keys);
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
* figure out way to store more data using phantomjs. increase in storageTest, see TODO. or only on browsers? testem etc...

    $ grunt test-server &
    $ phantomjs --help # -> --local-storage-quota=<val in KB> ...

    ---> but smt like the following fails with more than ~4MB..
    $ phantomjs --debug=false --local-storage-path=. --local-storage-quota=100000000000??? ./node_modules/mocha-phantomjs/lib/mocha-phantomjs.coffee http://localhost:1234/test

    $ grunt test #fails too if too much data..

* add testem support

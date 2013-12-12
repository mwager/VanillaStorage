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
    $ grunt test

## API Usage ##

```javascript
var storage = new VanillaStorage(TODO...)
```

## TODOs ##
* there is only requirejs support yet (ie you can only use it if you use requirejs/almond..)

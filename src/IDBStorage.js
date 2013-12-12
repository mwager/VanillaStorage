/**
 * IndexedDB adapter
 *
 * @see http://www.html5rocks.com/en/tutorials/indexeddb/todo/
 * @see http://net.tutsplus.com/tutorials/javascript-ajax/working-with-indexeddb/
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */
(function() {
    'use strict';

    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    // var IDBTransaction = window.hasOwnProperty('webkitIndexedDB') ? window.webkitIDBTransaction :
    //  window.IDBTransaction;
    // var IDBKeyRange = window.hasOwnProperty('webkitIndexedDB') ? window.webkitIDBKeyRange : window.IDBKeyRange;

    function factory(helpers) {
        var ensureCallback = helpers.ensureCallback,
            parseKey       = helpers.parseKey;

        var IDBStorage = function() {
            if(!this.isValid()) {
                return false;
            }

            this.DATABASE_NAME    = 'vanilla_idb';
            this.DATABASE_VERSION = 1.0;

            this.db = null; // filled in init()

            this.KEYS = [];
        };

        IDBStorage.prototype = {
            isValid: function() {
                return !!indexedDB && 'indexedDB' in window;
            },

            // we need to pass the keyPaths for the object stores
            setKeys: function(keys) {
                this.KEYS = keys;
            },

            /**
             * Init idb databse and object stores
             * @param  {[Function]} callback Callback
             */
            init: function(callback) {
                callback = ensureCallback(callback);
                var self = this;

                var request = window.indexedDB.open(
                    this.DATABASE_NAME,
                    this.DATABASE_VERSION
                );

                // NOTE: We can only create Object stores in a
                // "version change transaction".
                request.onupgradeneeded = function(e) {
                    // log('---indexed-db--- on upgradeneeded', self.KEYS);
                    var db = e.target.result;
                    var i;

                    for(i in self.KEYS) {
                        var key = parseKey(self.KEYS[i]);

                        // delete already existing stores with same name
                        if(db.objectStoreNames.contains(key)) {
                            db.deleteObjectStore(key);
                        }

                        var store = db.createObjectStore(key, {
                            keyPath: key,
                            autoIncrement: false
                        });
                        // store.createIndex(key, key, {unique:true});

                        log('---indexed-db--- created store: ' + key, store);
                    }
                };

                request.onsuccess = function(e) {
                    // log('---indexed-db--- on success');
                    self.db = e.target.result;
                    callback(null);
                };

                request.onerror = function(e) {
                    // log('---indexed-db--- ERROR' + e.target.error, e, e.target.error);
                    callback(e.target.error); // e.value?
                };
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                var trans, store;

                try {
                    trans = this.db.transaction([key], 'readonly');
                    store = trans.objectStore(key);

                    var request = store.get(key);

                    request.onsuccess = function(e) {
                        var result = e.target.result;

                        var res = !!result; // convert to bool
                        var nothingFound = (res === false);

                        if(nothingFound) {
                            // nothing found
                            return callback('No data found for key: ' + key);
                        }

                        return callback(null, result);
                    };
                    request.onerror = function(e) {
                        callback(e);
                    };

                    /*
                    // Get everything in the store;
                    NO. we just want by id. see above.
                    var keyRange      = IDBKeyRange.lowerBound(0);
                    var cursorRequest = store.openCursor(keyRange);

                    cursorRequest.onsuccess = function(e) {
                        var result = e.target.result;

                        var res = !!result; // convert to bool
                        var nothingFound = (res === false);

                        if(nothingFound) {
                            // nothing found
                            return callback(new FSCError('nothing found'));
                        }

                        return callback(null, result.value);

                        // not needed here?
                        // result.continue();
                    };
                    cursorRequest.onerror = function(e) {
                        callback(e);
                    };
                    */
                }
                catch(e) {
                    return callback(e);
                }
            },

            save: function(key, data, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                var trans, store, request;

                // delete all existing data first
                //this.delete(key, function __deleted() {
                try {
                    trans = this.db.transaction([key], 'readwrite');
                    store = trans.objectStore(key);

                    // key path in example:
                    // data.timestamp = new Date().getTime();

                    // we use the key as key (-;
                    data[key] = key;

                    try {
                        // create/update the data
                        request = store.put(data);

                        request.onsuccess = function(/*e*/) {
                            callback(null, data);
                        };

                        request.onerror = function(e) {
                            callback(e); // e.value?
                        };
                    }
                    catch(e) {
                        log(key, 'IDB Error put: ', e, ' data: ', data);
                        return callback(e);
                    }
                }
                catch(e) {
                    log(key, e);
                    return callback(e);
                }
                //});
            },

            delete: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                try {
                    var trans = this.db.transaction([key], 'readwrite');
                    var store = trans.objectStore(key);

                    try {
                        var request = store.delete(key);

                        request.onsuccess = function(/*e*/) {
                            callback(null);
                        };

                        request.onerror = function(e) {
                            callback(e);
                        };
                    }
                    catch(e) {
                        log('IDB Error delete: ', e, ' key ', key);
                        return callback(e);
                    }
                }
                catch(e) {
                    return callback(e);
                }
            },

            nuke: function(callback) {
                callback = ensureCallback(callback);

                var self = this;
                var len  = this.KEYS.length;

                function iterate(i) {
                    try {
                        self.delete(self.KEYS[i], function() {
                            if(--len === 0) {
                                return callback(null);
                            }

                            iterate(i++);
                        });
                    }
                    catch(e) {
                        log('IDB ERROR', e);
                        if(--len === 0) {
                            return callback(e);
                        }
                        iterate(i++);
                    }
                }

                iterate(0);
            }
        };

        return IDBStorage;
    }

    // Export using AMD support...
    if(typeof define === 'function' && define.amd) {
        define(['storageHelpers'], function(helpers) {
            return factory(helpers);
        });
    }
    // ...or simply to the global namespace
    else {
        window.IDBStorage = factory(window.storageHelpers);
    }
})();

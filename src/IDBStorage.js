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
            parseKey       = helpers.parseKey,
            out            = helpers.out;

        var IDBStorage = function(options) {
            if(!this.isValid()) {
                return false;
            }
            if(!options) {
                options = {};
            }
            var dbName  = options.storeName,
                version = options.version;

            try {
                version = parseInt(version, 10);
            }
            catch(e) {
                version = 1.0;
            }

            if(version < 1 || isNaN(version)) {
                version = 1.0;
            }

            this.db = null; // filled in init()

            this.DATABASE_VERSION  = version;
            this.DATABASE_NAME     = dbName || 'idbstore';
            this.OBJECT_STORE_NAME = this.DATABASE_NAME + '__data';
        };

        IDBStorage.prototype = {
            isValid: function() {
                return !!indexedDB && 'indexedDB' in window;
            },

            /**
             * Init idb databse and object stores
             * @param  {[Function]} callback Callback
             */
            init: function(callback) {
                callback = ensureCallback(callback);

                var self      = this;
                var storeName = this.OBJECT_STORE_NAME;
                var request;

                try {
                    request = indexedDB.open(
                        this.DATABASE_NAME,
                        this.DATABASE_VERSION
                    );
                } catch(e) {
                    return callback(e);
                }

                // NOTE: We can only create Object stores in a
                // "version change transaction".
                request.onupgradeneeded = function(e) {
                    if(!e || !e.target ||!e.target.result) {
                        return callback('IDBStorage.js - request.onupgradeneeded: ' +
                            'no database instance in e.target.result');
                    }

                    // out('---indexed-db--- on upgradeneeded');
                    var db = e.target.result;

                    try {
                        if(db.objectStoreNames.contains(storeName)) {
                            db.deleteObjectStore(storeName);
                        }

                        // var store =
                        db.createObjectStore(storeName, {
                            keyPath: 'id',
                            autoIncrement: false
                        });

                        // store.createIndex(key, key, {unique:true});

                        // out('---indexed-db--- created store: ' + storeName, store);
                    } catch(e) {
                        callback(e);
                    }
                };

                request.onsuccess = function(e) {
                    if(!e || !e.target ||!e.target.result) {
                        return callback('IDBStorage.js - request.onsuccess: no database instance in e.target.result');
                    }

                    // out('---indexed-db--- on success', e.target.result);
                    self.db = e.target.result;
                    callback(null);
                };

                request.onerror = function(e) {
                    if(!e || !e.target ||!e.target.error) {
                        return callback('IDBStorage.js - request.onupgradeneeded: no error info in e.target.error');
                    }
                    try {
                        var err = (e && e.target && e.target.error) ? e.target.error : e;
                        callback(err); // e.value?
                    }
                    catch(e) {
                        callback(e);
                    }
                };
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                var trans, store, request, storeName = this.OBJECT_STORE_NAME;

                if(!this.db) {
                    return callback('IDBStorage.js this.db is undefined');
                }

                try {
                    trans   = this.db.transaction([storeName], 'readonly');
                    store   = trans.objectStore(storeName);
                    request = store.get(key);

                    request.onsuccess = function(e) {
                        var result = e.target.result;

                        var res = !!result; // convert to bool
                        var nothingFound = (res === false) || (!result || !result.data);

                        if(nothingFound) {
                            // nothing found
                            return callback('No data found for key: ' + key);
                        }

                        return callback(null, result.data);
                    };
                    request.onerror = function(e) {
                        callback(e);
                    };
                }
                catch(e) {
                    return callback(e);
                }
            },

            getAll: function(callback) {
                callback = ensureCallback(callback);

                var trans, store, cursor, storeName = this.OBJECT_STORE_NAME;

                var data = [];

                if(!this.db) {
                    return callback('IDBStorage.js this.db is undefined');
                }

                try {
                    trans   = this.db.transaction([storeName], 'readonly');
                    store   = trans.objectStore(storeName);
                    cursor  = store.openCursor();

                    cursor.onsuccess = function(e) {
                        var res = e.target.result;

                        if(res) {
                            data.push({
                                key: res.key,
                                data: res.value.data
                            });
                            // continue...
                            res.continue();
                        }
                        // finally done?
                        else {
                            callback(null, data);
                        }
                    };
                    cursor.onerror = function(e) {
                        callback(e);
                    };
                }
                catch(e) {
                    return callback(e);
                }
            },

            save: function(key, data, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                if(!this.db) {
                    return callback('IDBStorage.js this.db is undefined');
                }

                var trans, store, request, storeName = this.OBJECT_STORE_NAME;

                // delete all existing data first
                try {
                    trans = this.db.transaction([storeName], 'readwrite');
                    store = trans.objectStore(storeName);

                    try {
                        // create/update the data
                        request = store.put({id: key, data: data});

                        request.onsuccess = function() {
                            callback(null, data);
                        };

                        request.onerror = function(e) {
                            callback(e); // e.value?

                            // http://stackoverflow.com/questions/15876465/javascript-handling-unknownerror
                            // ? rt docs.
                            return false;
                        };
                    }
                    catch(e) {
                        out('IDB Error save at key=' + key, ' data: ', data, ' error: ', e);
                        return callback(e);
                    }
                }
                catch(e) {
                    out(key, e);
                    return callback(e);
                }
            },


            drop: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                if(!this.db) {
                    return callback('IDBStorage.js this.db is undefined');
                }

                var storeName = this.OBJECT_STORE_NAME;

                try {
                    var trans = this.db.transaction([storeName], 'readwrite');
                    var store = trans.objectStore(storeName);

                    try {
                        // fix for IE:
                        // var request = store.delete(key);
                        var request = store['delete'](key);

                        request.onsuccess = function(/*e*/) {
                            callback(null);
                        };

                        request.onerror = function(e) {
                            callback(e);
                        };
                    }
                    catch(e) {
                        out('IDB Error delete: ', e, ' key ', key);
                        return callback(e);
                    }
                }
                catch(e) {
                    return callback(e);
                }
            },

            /**
             * Clear the whole store
             */
            nuke: function(callback) {
                callback = ensureCallback(callback);

                if(!this.db) {
                    return callback('IDBStorage.js this.db is undefined');
                }

                var storeName = this.OBJECT_STORE_NAME;

                try {
                    var trans = this.db.transaction([storeName], 'readwrite');
                    var store = trans.objectStore(storeName);

                    var clearRequest = store.clear();

                    clearRequest.onsuccess = function() {
                        callback(null);
                    };
                    clearRequest.onerror = function(e) {
                        callback(e);
                    };
                }
                catch(e) {
                    out('IDB Error nuke: ', e);
                    return callback(e);
                }
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

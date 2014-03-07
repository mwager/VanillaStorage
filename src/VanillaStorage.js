/**
 * VanillaStorage.js
 *
 * Simple client side storage abstraction
 *
 * This is basically just a wrapper for the different storage backends,
 * exporting a very simple API for CRUDing on the clientside by abstracting
 * the complexity of the multiple storage approaches behind a simple API.
 *
 * TODO check diffs:
 *  - http://labs.ft.com/2012/09/ft-style-web-app-on-firefox-and-ie6-to-ie10/
 *  - PouchDB example: http://jsfiddle.net/828Ng/
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 * @version 0.6.0
 */
(function() {
    'use strict';

    function factory(WebSQLStorage, IDBStorage, helpers) {
        var ensureCallback = helpers.ensureCallback;

        // helper for logging errors
        var errorOut = function() {
            if(console && console.error) {
                console.error.apply(console, arguments);
            }
        };

        // Order is relevant! first valid will be taken
        var adaptersWeSupport = {
            'indexeddb-storage': new IDBStorage(),
            'websql-storage'   : new WebSQLStorage()
        };

        /**
         * Constructor
         */
        var VanillaStorage = function(options, initCallback) {
            var self = this;

            this.adapter = null;

            // provide defaults
            options           = options || {};
            options.storeName = options.storeName || 'vanilla_store';
            options.version   = options.version || '1.0';
            initCallback      = ensureCallback(initCallback);

            // overwrite. Order is relevant!
            adaptersWeSupport = {
                'indexeddb-storage': new IDBStorage(options),
                'websql-storage'   : new WebSQLStorage(options)
            };

            // which adapter shall we use?
            if(options && options.adapterID) {
                this.adapter   = adaptersWeSupport[options.adapterID];
                this.adapterID = options.adapterID;
            }
            else {
                for(var adapterID in adaptersWeSupport) {
                    var validFn = typeof adaptersWeSupport[adapterID].isValid === 'function';

                    if(validFn && adaptersWeSupport[adapterID].isValid()) {
                        this.adapter   = adaptersWeSupport[adapterID];
                        this.adapterID = adapterID;
                        break;
                    }
                }
            }

            var aID = this.adapterID;

            // force use websql in cordova. on android 4,
            // idb is valid but lots of strange errors,
            // websql officially supported by phonegap
            if(typeof window.cordova !== 'undefined') {
                aID            = 'websql-storage';
                this.adapter   = adaptersWeSupport[aID];
                this.adapterID = aID;
            }

            // does the current browser support idb or websql?
            if(!this.adapter || !this.adapter.isValid()) {
                return initCallback.apply(self, ['no adapter or adapter not valid - id=' + aID]);
            }

            try {
                // we need to initialize the used adapter async
                this.adapter.init(function(err) {
                    if(err) {
                        // some logging:
                        errorOut('VanillaStorage.js error initializing adapter', err);

                        // NOTE: If smt in init() goes wrong, this means that
                        // idb or websql had some errors so we return an error here
                        return initCallback.apply(self, ['error in init of adapter id=' + aID]);
                    }

                    initCallback.call(self); // no error
                });
            } catch(e) {
                // some logging:
                errorOut(e);

                return initCallback.apply(self, ['exception in init of adapter id=' + aID]);
            }
        };

        /**
         * The API
         *
         * NOTE: For LocalStorage we catch all exceptions and pass them as
         *       first param in the error callback
         */
        VanillaStorage.prototype = {
            /**
             * Check if the currently used storage method is supported
             * @return {boolean} True if supported
             */
            isValid: function() {
                return this.adapter.isValid();
            },

            /**
             * Fetch data for a given key
             *
             * @param {string}   key      The key
             * @param {function} callback The callback - node style (err, data)
             */
            get: function(key, callback) {
                callback = ensureCallback(callback);

                this.adapter.get(key, callback);
            },

            /**
             * Fetch all data for all stored keys (i.e. "all rows")
             *
             * @param {string}   key      The key
             * @param {function} callback The callback - node style (err, data)
             *                            `data` will be an array ob objects
             *                            like [{key: <key>, data: <data>}, ...]
             */
            getAll: function(callback) {
                callback = ensureCallback(callback);

                this.adapter.getAll(callback);
            },

            /**
             * Fetch data for a given key
             *
             * @param {string}   key      The key
             * @param {object}   data     The data to store. May be an object or
             *                            an array and must be JSON parseable
             * @param {function} callback The callback - node style (err, data)
             */
            save: function(key, data, callback) {
                callback = ensureCallback(callback);

                this.adapter.save(key, data, callback);
            },

            /**
             * Delete data for a given key
             *
             * @param {string}   key      The key
             * @param {function} callback The callback - node style (err, data)
             */
            drop: function(key, callback) {
                callback = ensureCallback(callback);

                this.adapter.drop(key, callback);
            },

            /**
             * Delete all data for all keys
             *
             * @param {function} callback The callback - node style (err)
             */
            nuke: function(callback) {
                callback = ensureCallback(callback);

                this.adapter.nuke(callback);
            },

            /**
             * Calculates the size (in MB) of the current storage (useful for development)
             *
             * @param {function} callback The callback - node style (err)
             */
            __getStorageSize: function(callback) {
                callback = ensureCallback(callback);

                this.getAll(function(err, data) {
                    if(err) {
                        return callback(err);
                    }

                    if(!data || data.length === 0) {
                        callback('No data found');
                    }

                    var i, len = data.length, row, bytesCnt = 0;
                    for(i = 0; i < len; i++) {
                        row = data[i];
                        try {
                            // log(">>", JSON.stringify(row))
                            bytesCnt += JSON.stringify(row).length;
                        }
                        catch(e) {
                            errorOut(e);
                        }
                    }

                    // round:
                    var size = bytesCnt/1024/1024;
                    size = Math.round(size * 100) / 100;
                    callback(null, size);
                });
            }
        };

        // --- static stuff ---

        // static isValid helper (needed in storageTest.js)
        VanillaStorage.isValid = function(adapterID) {
            var adapter = adaptersWeSupport[adapterID];
            return adapter ? adapter.isValid() : false;
        };

        return VanillaStorage;
    }


    // Export using AMD support...
    if(typeof define === 'function' && define.amd) {
        define([
                'WebSQLStorage',
                'IDBStorage',
                'storageHelpers'
            ], function(WebSQLStorage, IDBStorage, storageHelpers) {
                var VanillaStorage = factory(WebSQLStorage, IDBStorage, storageHelpers);
                return VanillaStorage;
            }
        );
    }
    // ...or simply to the global namespace
    else {
        window.VanillaStorage = factory(
            window.WebSQLStorage,
            window.IDBStorage,
            window.storageHelpers
        );
    }
})();

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
 * @version 0.4.6
 */
(function() {
    'use strict';

    function factory(LocalStorage, WebSQLStorage, IDBStorage, helpers) {
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
                'indexeddb-storage': new IDBStorage(options.storeName, options.version),
                'websql-storage'   : new WebSQLStorage(options.storeName, options.version)
            };

            // if idb and websql is not supported (eg ie<=9) or if something
            // goes wrong in the init process of the db adapters, we fallback
            // to window.localStorage
            var lsFallbackDone       = false;
            var localStorageFallback = function() {
                if(lsFallbackDone) {
                    return false;
                }
                lsFallbackDone = true;

                // ignore jshint errors: "possible strict violation"
                /* jshint ignore:start */
                try {
                    this.localStorageFallback = true;
                    this.adapter              = new LocalStorage();
                    this.adapterID            = 'local-storage';

                    initCallback.call(self); // no error
                }catch(e) {
                    errorOut(e);
                    initCallback.apply(self, ['window.localStorage not supported in this browser: ' +
                        navigator.userAgent]);
                }
                /* jshint ignore:end */
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

            // force use websql in cordova. on android 4,
            // idb is valid but lots of strange errors
            if(typeof window.cordova !== 'undefined') {
                var aID        = 'websql-storage';
                this.adapter   = adaptersWeSupport[aID];
                this.adapterID = aID;
            }

            // does the current browser support idb or websql?
            if(!this.adapter || !this.adapter.isValid()) {
                return localStorageFallback.call(this);
            }

            try {
                // we need to initialize the used adapter async
                this.adapter.init(function(err) {
                    if(err) {
                        // NOTE: If smt in init() goes wrong, this means that
                        // idb or websql had some errors so we can fallback to
                        // LocalStorage here:
                        return localStorageFallback.call(self);
                        // return initCallback.apply(self, [err]);
                    }

                    initCallback.call(self); // no error
                });
            } catch(e) {
                // some logging:
                errorOut(e);

                return localStorageFallback.call(self);
            }
        };

        /**
         * The API
         *
         * NOTE: For LocalStorage we catch all exceptions and pass them as
         *       first param in the error callback
         */
        VanillaStorage.prototype = {
            isValid: function() {
                return this.adapter.isValid();
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);

                if(this.localStorageFallback) {
                    try {
                        var data = this.adapter.get(key);

                        if(!data) {
                            callback('No data found using LS adapter');
                        }
                        else {
                            callback(null, data);
                        }
                    }
                    catch(e) {
                        callback(e);
                    }
                }
                else {
                    this.adapter.get(key, callback);
                }
            },

            save: function(key, data, callback) {
                callback = ensureCallback(callback);

                if(this.localStorageFallback) {
                    try {
                        this.adapter.save(key, data);
                        callback(null, data);
                    }
                    catch(e) {
                        callback(e);
                    }
                }
                else {
                    this.adapter.save(key, data, callback);
                }
            },

            delete: function(key, callback) {
                callback = ensureCallback(callback);

                if(this.localStorageFallback) {
                    try {
                        this.adapter.delete(key);
                        callback(null);
                    }
                    catch(e) {
                        callback(e);
                    }
                }
                else {
                    this.adapter.delete(key, callback);
                }
            },

            nuke: function(callback) {
                callback = ensureCallback(callback);

                if(this.localStorageFallback) {
                    try {
                        this.adapter.nuke();
                        callback(null);
                    }
                    catch(e) {
                        callback(e);
                    }
                }
                else {
                    this.adapter.nuke(callback);
                }
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
                'LocalStorage',
                'WebSQLStorage',
                'IDBStorage',
                'storageHelpers'
            ], function(LocalStorage, WebSQLStorage, IDBStorage, storageHelpers) {
                var VanillaStorage = factory(LocalStorage, WebSQLStorage, IDBStorage, storageHelpers);
                return VanillaStorage;
            }
        );
    }
    // ...or simply to the global namespace
    else {
        window.VanillaStorage = factory(
            window.LocalStorage,
            window.WebSQLStorage,
            window.IDBStorage,
            window.storageHelpers
        );
    }
})();

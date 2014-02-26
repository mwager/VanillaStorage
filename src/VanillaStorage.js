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

    function factory(WebSQLStorage, IDBStorage, helpers, LZString) {
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

            // TODO if options.useCompression
            options.compressor = LZString;

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
            isValid: function() {
                return this.adapter.isValid();
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);

                this.adapter.get(key, callback);
            },

            save: function(key, data, callback) {
                callback = ensureCallback(callback);

                this.adapter.save(key, data, callback);
            },

            drop: function(key, callback) {
                callback = ensureCallback(callback);

                this.adapter.drop(key, callback);
            },

            nuke: function(callback) {
                callback = ensureCallback(callback);

                this.adapter.nuke(callback);
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
                'storageHelpers',
                'lz_string'
            ], function(WebSQLStorage, IDBStorage, storageHelpers, LZString) {
                var VanillaStorage = factory(WebSQLStorage, IDBStorage, storageHelpers, LZString);
                return VanillaStorage;
            }
        );
    }
    // ...or simply to the global namespace
    else {
        window.VanillaStorage = factory(
            window.WebSQLStorage,
            window.IDBStorage,
            window.storageHelpers,
            window.LZString
        );
    }
})();

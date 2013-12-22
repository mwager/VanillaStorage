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
 * @version 0.4.2
 */
(function() {
    'use strict';

    function factory(LocalStorage, WebSQLStorage, IDBStorage, helpers) {
        var ensureCallback = helpers.ensureCallback;

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

            initCallback = ensureCallback(initCallback);

            this.adapter = null;

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

            if(!this.adapter || !this.adapter.isValid()) {
                // if idb and websql is not supported (eg ie<=9)
                // we fallback to localstorage
                this.localStorageFallback = true;
                this.adapter = new LocalStorage();
                return initCallback.call(self, null);

                // var errMsg = 'Storage: No valid adapter: ' + this.adapterID;
                // return initCallback.call(self, errMsg);
                // throw new Error(errMsg);
            }

            // need to init the used adapter async
            this.adapter.init(function(err) {
                if(err) {
                    initCallback.call(self, err);
                }

                initCallback.call(self, null);
            });
        };

        // THE API:
        VanillaStorage.prototype = {
            isValid: function() {
                return this.adapter.isValid();
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);

                if(this.localStorageFallback) {
                    try {
                        var data = this.adapter.get(key);
                        callback(null, data);
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

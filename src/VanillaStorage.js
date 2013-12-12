/**
 * VanillaStorage.js
 *
 * Simple custom client side storage abstraction
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
 */
(function() {
    'use strict';

    function factory(WebSQLStorage, IDBStorage, helpers) {
        var ensureCallback = helpers.ensureCallback;

        // Order is relevant! first valid will be taken
        var adaptersWeSupport = {
            // TODO idb first! passt das?
            // on android, idb also works in the webview!
            // but should we go with phonegap "supported” websql!?
            // check the mocha storage tests in cordova shell
            // and compare times!!!
            'indexeddb-storage': new IDBStorage(),
            'websql-storage'   : new WebSQLStorage()

            // we do not support local storage here as a fallback,
            // as the size limits are not acceptable
            // 'local-storage' : new LocalStorage()
        };

        // The exported object
        var Storage = function(attr, initCallback) {
            var self = this;

            initCallback = ensureCallback(initCallback);

            this.adapter = null;

            // which adapter shall we use?
            if(attr && attr.adapterID) {
                this.adapter   = adaptersWeSupport[attr.adapterID];
                this.adapterID = attr.adapterID;
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
                var errMsg = 'Storage: No valid adapter: ' + this.adapterID;
                return initCallback.call(self, errMsg);
                // throw new Error(errMsg);
            }

            // Indexed DB needs the keys on creation
            if(typeof this.adapter.setKeys === 'function' && attr && attr.keys) {
                this.adapter.setKeys(attr.keys);
            }

            // need to init the used adapter
            this.adapter.init(function(err) {
                if(err) {
                    initCallback.call(self, err);
                }

                initCallback.call(self, null);
            });
        };

        // THE API:
        Storage.prototype = {
            isValid: function() {
                return this.adapter.isValid();
            },

            get: function(key, callback) {
                this.adapter.get(key, callback);
            },

            save: function(key, data, callback) {
                this.adapter.save(key, data, callback);
            },

            delete: function(key, callback) {
                this.adapter.delete(key, callback);
            },

            nuke: function(callback) {
                this.adapter.nuke(callback);
            }
        };

        // --- static stuff ---

        // static isValid helper (needed in storageTest.js)
        Storage.isValid = function(adapterID) {
            var adapter = adaptersWeSupport[adapterID];
            return adapter ? adapter.isValid() : false;
        };

        return Storage;
    }


    // Export using AMD support...
    if(typeof define === 'function' && define.amd) {
        define([
                './WebSQLStorage',
                './IDBStorage',
                './storageHelpers'
            ], function(WebSQLStorage, IDBStorage, storageHelpers) {
                var Storage = factory(WebSQLStorage, IDBStorage, storageHelpers);
                return Storage;
            }
        );
    }
    // ...or simply to the global namespace
    else {
        window.Storage = factory(
                window.WebSQLStorage,
                window.IDBStorage,
                window.storageHelpers
            );

        return window.Storage;
    }
})();

/**
 * LocalStorage.js
 *
 * Simple wrapper for localStorage with JSON stringify/parse support
 *
 * @author  Michael Wager <mail@mwager.de>
 * @licence MIT
 * @version 1.0
 */
(function() {
    'use strict';

    // slugify helper
    function parseKey(key) {
        key = key.replace(/\//g, '');
        key = key.replace(/[:]/g, '');
        key = key.replace(/[.]/g, '');
        return 'ls_' + key;
    }

    /**
     * Constructor
     */
    var LocalStorage = function() {
        this.storage = window.localStorage;

        var self = this;

        // test for support
        this.isValid = !!window.localStorage && (function() {
            // in mobile safari if safe browsing is enabled, window.storage
            // is defined but setItem calls throw exceptions.
            var success = true;
            var value = Math.random();
            try {
                self.storage.setItem(value, value);
            } catch (e) {
                success = false;
            }
            self.storage.removeItem(value);
            return success;
        })();

        if(!this.isValid) {
            throw 'No window.localStorage support in here: ' + navigator.userAgent;
        }
        if(!window.JSON) {
            throw 'No window.JSON support in here: ' + navigator.userAgent;
        }
    };

    LocalStorage.prototype = {
        /**
         * Get data by key
         *
         * @param {string} key  The key to get the data for
         * @return {mixed} The JSON.parse()`d data
         */
        get: function(key) {
            key = parseKey(key);

            var data = JSON.parse(
                this.storage.getItem(key)
            );

            return data;
        },

        /**
         * Store data to localStorage
         *
         * @param {string} key  The key
         * @param {mixed}  data The value, will be stringified
         */
        save: function(key, data) {
            key = parseKey(key);

            this.storage.setItem(key, JSON.stringify(data));
        },

        /**
         * Delete the data stored by 'key' if it exists.
         *
         * @param {string} key  The key
         */
        drop: function(key) {
            key = parseKey(key);

            this.storage.removeItem(key);
        },

        /**
         * Clear all data from localStorage
         */
        nuke: function() {
            this.storage.clear();
        }
    };



    // Export using AMD support...
    if(typeof define === 'function' && define.amd) {
        define([/* no deps */], function() {
            return LocalStorage;
        });
    }
    // ...or simply to the global namespace
    else {
        window.LocalStorage = LocalStorage;
    }
})();

/**
 * Helpers needed in the storage modules
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */
(function() {
    'use strict';

    var helpers = {
        // customParseKey = function(key) { return key; },

        ensureCallback: function(callback) {
            return typeof callback !== 'function' ? function() {} : callback;
        },

        /**
         * Parse the key.
         *
         * IndexedDB key must be valid, no ".", ":", "/" allowed
         * For WebSQL, it is also better to parse the key
         */
        parseKey: function(key) {
            // key = this.customParseKey(key);

            // replace slashes:
            key = key.replace(/\//g, '');
            key = key.replace(/[:]/g, '');
            key = key.replace(/[.]/g, '');

            return key;
        },

        // custom log helper
        out: function() {
            if(!window.console || !console.log) {
                return false;
            }

            arguments[0] = '[Vanilla LOG] ' + arguments[0];

            console.log.apply(console, arguments);
        }
    };


    // Export using AMD...
    if(typeof define === 'function' && define.amd) {
        define([/* no deps */], function() {
            return helpers;
        });
    }
    // ...or simply to the global namespace
    else {
        window.storageHelpers = helpers;
    }
})();

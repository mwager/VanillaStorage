/**
 * Helpers needed in the storage modules
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */
(function() {
    'use strict';

    var helpers = {
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
            // solange wir REST URLS verwenden: (TODO better)
            // key = key.replace(__app_config__.apiBase, '');

            // replace slashes:
            key = key.replace(/\//g, '');
            key = key.replace(/[:]/g, '');
            key = key.replace(/[.]/g, '');

            return key;
        }
    };

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

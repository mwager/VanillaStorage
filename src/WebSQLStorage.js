/**
 * WebSQL adapter - manages a simple table with key/val/timestamp
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */
(function() {
    'use strict';

    function factory(helpers) {
        var ensureCallback = helpers.ensureCallback,
            parseKey       = helpers.parseKey,
            out            = helpers.out;

        var WebSQLStorage = function(options) {
            if(!this.isValid()) {
                return false;
            }
            if(!options) {
                options = {};
            }
            var dbName  = options.storeName,
                version = options.version;

            this.compressor = typeof options.compressor !== 'undefined' ?
                                options.compressor :
                                false;

            this.db = null; // filled in init()

            this.DATABASE_NAME      = dbName  || 'websqlstore';
            this.DATABASE_VERSION   = version || '1.0'; // int !?
            this.TABLE_NAME         = this.DATABASE_NAME + '__data';

            // requesting 50mb is too much on ios7:
            // http://stackoverflow.com/questions/19126034/web-sql-grow-database-for-ios
            // our tests showed that even worst cases the storage should never be
            // bigger than 5MB, but it could, so then it will grow autom..
            this.DATABASE_SIZE    = 1048576 * 5;
        };

        WebSQLStorage.prototype = {
            isValid: function() {
                return !!window.openDatabase;
            },

            init: function(callback) {
                callback = ensureCallback(callback);

                // Avoid Phantomjs Error via try/catch:
                // "DOM Exception 18: An attempt was made to break through the
                // security policy of the user agent"
                try {
                    if(this.isValid()) {
                        this.db = window.openDatabase(
                            this.DATABASE_NAME,
                            this.DATABASE_VERSION,
                            this.DATABASE_NAME,
                            this.DATABASE_SIZE
                        );
                    }
                }
                catch(e) {
                    return callback('error opening websql database: ' +
                        e.message ? e.message : e);
                }

                if(!this.db) {
                    return callback('No db available');
                }

                var create = 'CREATE TABLE IF NOT EXISTS ' + this.TABLE_NAME +
                    ' (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)';

                this.db.transaction(function (t) {
                    t.executeSql(create, []);
                }, function fail(e/*, i*/) {
                    callback(e);
                    return true;
                }, function win() {
                    callback(null);
                });
            },

            get: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                if(!this.db) {
                    return callback('No db available');
                }

                var self = this;

                var sql = 'SELECT value FROM ' + this.TABLE_NAME + ' WHERE id = ?';

                this.db.transaction(function (t) {
                    t.executeSql(sql, [key], function success(t, results) {
                        var data = null;

                        if(results.rows.length > 0) {
                            data = results.rows.item(0).value;
                            try {
                                if (self.compressor) {
                                    data = self.compressor.decompressFromUTF16(data);
                                    // log('decompressed: ' + data)
                                }

                                data = JSON.parse(data);
                            }
                            catch(e) {
                                return callback('JSON Parse error: ' + data);
                            }
                        }

                        if(data) {
                            callback(null, data);
                        }
                        else {
                            callback('No data found for key: ' + key);
                        }
                    });
                }, function fail(e/*, i*/) {
                    callback(e);
                    return true;
                });
            },

            save: function(key, dataIn, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                if(!this.db) {
                    return callback('No db available');
                }

                var data;

                try {
                    data = JSON.stringify(dataIn);
                    if (this.compressor) {
                        data = this.compressor.compressToUTF16(data);
                        // log('STORING: ' + data)
                    }
                }
                catch(e) {
                    out(e);
                    return callback('JSON Parse error: ' + dataIn);
                }

                var ins     = 'INSERT OR REPLACE INTO ' + this.TABLE_NAME + ' (id, value, timestamp) VALUES (?,?,?)';
                var insVals = [key, data, new Date().getTime()];

                this.db.transaction(function (t) {
                    t.executeSql(ins, insVals, function success(/*t*/) {
                        // on success we pass it back like it was:
                        callback(null, dataIn);
                    });
                }, function fail(e/*, i*/) {
                    callback(e);
                    return true; // rollback
                });
            },

            drop: function(key, callback) {
                callback = ensureCallback(callback);
                key      = parseKey(key);

                if(!this.db) {
                    return callback('No db available');
                }

                var sql = 'DELETE FROM ' + this.TABLE_NAME + ' WHERE id = ?';
                this.db.transaction(function (t) {
                    t.executeSql(sql, [key], function success() {
                        callback(null);
                    });
                }, function fail(e/*, i*/) {
                    callback(e);
                    return true; // rollback
                });
            },

            nuke: function(callback) {
                callback = ensureCallback(callback);

                if(!this.db) {
                    return callback('No db available');
                }

                var sql = 'DELETE FROM ' + this.TABLE_NAME;
                this.db.transaction(function (t) {
                    t.executeSql(sql, [], function success() {
                        callback(null);
                    });
                }, function fail(e/*, i*/) {
                    callback(e);
                    return true; // rollback
                });
            }
        };

        return WebSQLStorage;
    }

    // Export using AMD support...
    if(typeof define === 'function' && define.amd) {
        define(['storageHelpers'], function(helpers) {
            return factory(helpers);
        });
    }
    // ...or simply to the global namespace
    else {
        window.WebSQLStorage = factory(window.storageHelpers);
    }
})();

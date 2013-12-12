/**
 * This suite tests our own clientside storage abstraction lib
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    // What does this test do?
    // ----------------------
    // First we run run isolated tests on the standalone IDB- and WebSQL
    // Wrappers to test and document the api usage.
    // Then we test the Storage Frontend (VanillaStorage), which abstracts away
    // the used storage engine. This works because both adapters
    // (idb and websql) are exporting the same async interface, so basically
    // "Storage" is just a simple proxy for the other libs

    // This class...
    var Storage = require('src/VanillaStorage');

    // ...is using this two classes under the hood: (which we also test in
    // isolation here)
    var IDBStorage    = require('src/IDBStorage');
    var WebSQLStorage = require('src/WebSQLStorage');

    var DEMO_DATA = {foo: 'bar'};
    var TMP_KEY   = 'tmp';

    function getRandomBetween(min, max) {
        return parseInt(window.Math.random() * (max - min) + min, 10);
    }

    // generate some demo data
    var BIG_STRING = [];
    var LARGE_OBJECT = {};
    var LARGE_LEN;
    var factor = 1024;
    var size   = 1.0 * factor * factor;

    (function __generateDemoData() {
        var letters = 'abcdefghijklmnopqrstuvwxyz';
        letters    += letters.toUpperCase() + '123456789';

        var idx, i;

        for(i = 0; i < size; i++) {
            idx = getRandomBetween(0, letters.length);
            // log(idx, letters[idx])
            BIG_STRING.push(letters[idx]);
        }

        BIG_STRING = BIG_STRING.join('');

        for(i = 0; i < 10; i ++) {
            var t = {};
            for(var j = 0; j < 10; j ++) {
                t.largeString = BIG_STRING;
                t.aNum = 1235678976543;
                t.aNum2 = 1235678976543.12345678987654;
                /* jshint ignore:start */
                // t.fn = function() { var a = BIG_STRING; };
                /* jshint ignore:end */
            }
            LARGE_OBJECT[i] = t;
        }

        LARGE_LEN = JSON.stringify(LARGE_OBJECT).length;
    })();



    describe('Storage Abstraction', function () {

        function runSuiteForWebSQLStorage() {
            describe('Isolation :: WebSQLStorage', function () {
                before(function(done) {
                    this.webSQLStorage = new WebSQLStorage();
                    this.webSQLStorage.init(done);
                });

                it('should be initialized', function() {
                    expect(typeof this.webSQLStorage).to.equal('object');
                });
                it('should store data', function(done) {
                    var testData = ['hallo welt', {foo: 'bar'}];
                    this.webSQLStorage.save(TMP_KEY, testData, function(err, data) {
                        expect(!!err).to.equal(false);
                        expect(data[0]).to.equal('hallo welt');
                        done();
                    });
                });
                it('should read the stored data', function(done) {
                    this.webSQLStorage.get(TMP_KEY, function(err, data) {
                        expect(!!err).to.equal(false);
                        expect(data[0]).to.equal('hallo welt');
                        expect(data[1].foo).to.equal('bar');
                        done();
                    });
                });
                it('should delete the stored data', function(done) {
                    var self = this;
                    this.webSQLStorage.delete(TMP_KEY, function(err) {
                        expect(!!err).to.equal(false);

                        // really gone?
                        self.webSQLStorage.get(TMP_KEY, function(err, data) {
                            expect(!!err).to.equal(true); // nothing found!
                            expect(typeof data).to.equal('undefined');
                            done();
                        });
                    });
                });
                it('should store even more data', function(done) {
                    var start = window.performance.now();
                    this.webSQLStorage.save(TMP_KEY, LARGE_OBJECT,
                        function __saved(err) {
                            if(err) {
                                log(err);
                            }

                            expect(!!err).to.equal(false);
                            var t = window.round(window.performance.now() - start / 1000, 2);
                            log('Isolation WebSQLStorage: stored ~' +
                                window.round(LARGE_LEN/factor/factor, 3) + 'MB in ~' + t + 's');

                            done();
                        }
                    );
                });
            });
        }

        function runSuiteForIDBStorage() {
            describe('Isolation :: IDBStorage', function () {
                before(function(done) {
                    this.idbStorage = new IDBStorage();
                    this.idbStorage.setKeys(['tmp']);
                    this.idbStorage.init(done);
                });
                it('should be initialized', function() {
                    expect(typeof this.idbStorage).to.equal('object');
                });
                it('should store data', function(done) {
                    var testData = ['hallo welt', {foo: 'bar'}];
                    this.idbStorage.save(TMP_KEY, testData, function(err, data) {
                        expect(!!err).to.equal(false);
                        expect(data[0]).to.equal('hallo welt');
                        done();
                    });
                });
                it('should read the stored data', function(done) {
                    this.idbStorage.get(TMP_KEY, function(err, data) {
                        expect(!!err).to.equal(false);
                        expect(data[0]).to.equal('hallo welt');
                        expect(data[1].foo).to.equal('bar');
                        done();
                    });
                });
                it('should delete the stored data', function(done) {
                    var self = this;
                    this.idbStorage.delete(TMP_KEY, function(err) {
                        expect(!!err).to.equal(false);

                        // wait a little bit... (XXX better way?)
                        setTimeout(function() {
                            // really gone?
                            self.idbStorage.get(TMP_KEY, function(err, data) {
                                // sometimes there is data, means it didnt get
                                // deleted in that short time...?
                                if(!err) {
                                    log('IDB TESTS - WTF!??!', data);
                                }

                                expect(!!err).to.equal(true); // nothing found!
                                expect(typeof data).to.equal('undefined');
                                done();
                            });
                        }, 900);
                    });
                });

                it('should store some more data', function(done) {
                    this.idbStorage.save(TMP_KEY, [[{foo: '12e', aString: BIG_STRING}]],
                        function __saved(err, data) {
                            expect(!!err).to.equal(false);
                            expect(data[0][0].foo).to.equal('12e');
                            done();
                        }
                    );
                });

                it('should store even more data', function(done) {
                    var start = window.performance.now();
                    this.idbStorage.save(TMP_KEY, LARGE_OBJECT,
                        function __saved(err) {
                            expect(!!err).to.equal(false);

                            var t = (window.performance.now() - start) / 1000;
                            log('Isolation IDBStorage: stored ~' +
                                window.round(LARGE_LEN/factor/factor, 3) + 'MB in ~' + t + 's');

                            done();
                        }
                    );
                });
            });
        }

        var wsql = new WebSQLStorage();
        if(wsql.isValid()) {
            runSuiteForWebSQLStorage();
        }
        var idb = new IDBStorage();
        if(idb.isValid()) {
            runSuiteForIDBStorage();
        }


        // ----------- run for both adapters: idb and websql
        function runSuiteForCurrentAdapter(adapterID) {

            describe('Abstraction: CRUD Adapter implementing IDB or WebSQL under the hood', function() {
                describe('Basic CRUD (adapter: ' + adapterID + ')', function() {

                    before(function(done) {
                        var self = this;

                        this.keys = [
                            'tmp',
                            'anotherkey'
                        ];

                        this.KEY = this.keys[0];

                        // for indexed db, we must pass the keys
                        // try force the adapter, but this cannot work in all browsers...
                        var storageOptions = {
                            adapterID: adapterID,
                            keys:      this.keys
                        };

                        new Storage(storageOptions, function __readyToUseAPI(err) {
                            if(err) {
                                log('ERROR STORAGE: ' + err);
                                return done();
                                // throw err;
                            }

                            self.storage = this;
                            done();
                        });

                    });

                    it('should store data', function(done) {
                        /*if(!this.storage) {
                            return done();
                        }*/
                        this.storage.save(this.KEY, DEMO_DATA, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(DEMO_DATA.foo);
                            done();
                        });
                    });

                    it('should store lots of "rows"m for testing performance', function(done) {
                        if(!this.storage) {
                            return done();
                        }
                        var len = 200; // bei 100 websql in chrome bereits 4 secs !
                        var lenO = len;
                        var start;
                        var self = this;

                        function iter() {
                            self.storage.save(self.KEY, DEMO_DATA, function(err) {
                                expect(err).to.equal(null);

                                if(--len === 0) {
                                    var t = (window.performance.now() - start) / 1000;
                                    log('time storing ' + lenO + ' rows: ~' + window.round(t, 3) + 's');
                                    done();
                                }
                                else {
                                    iter();
                                }
                            });
                        }

                        start = window.performance.now();
                        iter();
                    });

                    it('should read data', function(done) {
                        if(!this.storage) {
                            return done();
                        }
                        this.storage.get(this.KEY, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(DEMO_DATA.foo);
                            done();
                        });
                    });

                    it('should delete data', function(done) {
                        if(!this.storage) {
                            return done();
                        }
                        var self = this;
                        this.storage.delete(this.KEY, function(err) {
                            expect(err).to.equal(null);

                            // really gone?
                            self.storage.get(self.KEY, function(err) {
                                // NO DATA FOUND
                                expect(typeof err).to.not.equal('undefined');
                                done();
                            });
                        });
                    });

                    it('should nuke all data', function(done) {
                        if(!this.storage) {
                            return done();
                        }
                        this.storage.nuke(function(err) {
                            expect(err).to.equal(null);
                            done();
                        });
                    });
                });

                describe('Advanced CRUD (adapter: ' + adapterID + ')', function() {
                    it('should save lots of data at once', function(done) {
                        if(!this.storage) {
                            log('STORAGE-TESTS: No storage instance for adapterID=' + adapterID + ' ???');
                            return done();
                        }

                        var start = window.performance.now();

                        this.storage.save(this.KEY, {aString: BIG_STRING}, function(err, data) {
                            expect(err).to.equal(null);
                            expect(BIG_STRING).to.equal(data.aString);

                            // show some stats
                            var time = (window.performance.now() - start) / 1000;
                            log('It took ~' + window.round(time, 3) + 's to store ' + size/factor/factor +
                                'MB of data using the ' + adapterID + ' adapter');

                            done();
                        });
                    });
                    it('should read lots of data at once', function(done) {
                        if(!this.storage) {
                            return done();
                        }

                        var start = window.performance.now();

                        this.storage.get(this.KEY, function(err, data) {

                            expect(typeof data.aString).to.not.equal('undefined');

                            // show some stats
                            var time = (window.performance.now() - start) / 1000;
                            log('It took ~' + window.round(time, 3) + 's to read ' + size/factor/factor +
                                'MB of data using the ' + adapterID + ' adapter');

                            done();
                        });
                    });
                });
            });
        }

        // *** tests for different adapters ***
        var adapterID;

        adapterID = 'websql-storage';
        if(Storage.isValid(adapterID)) {
            runSuiteForCurrentAdapter(adapterID);
        }
        adapterID = 'indexeddb-storage';
        if(Storage.isValid(adapterID)) {
            runSuiteForCurrentAdapter(adapterID);
        }
    });
});

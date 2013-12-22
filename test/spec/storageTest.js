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
    var VanillaStorage = require('VanillaStorage');

    // ...is using this two classes under the hood: (which we also test in
    // isolation here)
    var IDBStorage    = require('IDBStorage');
    var WebSQLStorage = require('WebSQLStorage');

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

        // TODO increase 2 to 10 or more...
        for(i = 0; i < 2; i ++) {
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



    describe('VanillaStorage.js Storage Abstraction', function () {

        // ------------------------------------------
        // TODO zu *einer* Methode zusammenführen
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
                    var start = window.__now();
                    var LEN = 1; // TODO figure out how to store more!
                    var self = this;

                    function it() {
                        self.webSQLStorage.save(TMP_KEY + '_' + LEN, LARGE_OBJECT,
                            function __saved(err) {
                                expect(!!err).to.equal(false);

                                var t = (window.__now() - start) / 1000;
                                log('Isolation WebSQLStorage: stored ~' +
                                    window.round(LARGE_LEN/factor/factor, 3) + 'MB in ~' + t + 's');

                                if(--LEN === 0) {
                                    done();
                                }
                                else  {
                                    it();
                                }
                            }
                        );
                    }
                    it();
                });
            });
        }
        function runSuiteForIDBStorage() {
            describe('Isolation :: IDBStorage', function () {
                before(function(done) {
                    this.idbStorage = new IDBStorage();
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
                    var start = window.__now();
                    this.idbStorage.save(TMP_KEY, LARGE_OBJECT,
                        function __saved(err) {
                            expect(!!err).to.equal(false);

                            var t = (window.__now() - start) / 1000;
                            log('Isolation IDBStorage: stored ~' +
                                window.round(LARGE_LEN/factor/factor, 3) + 'MB in ~' + t + 's');

                            done();
                        }
                    );
                });
            });
        }
        // ------------------------------------------

        var wsql = new WebSQLStorage();
        if(wsql.isValid()) {
            runSuiteForWebSQLStorage();
        }
        var idb = new IDBStorage();
        if(idb.isValid()) {
            runSuiteForIDBStorage();
        }
        // TODO local storage isolation here too? why not.
        //      -> its the same method - different adapter. ! do it.


        // ----------- run for both adapters: idb and websql
        function runSuiteForCurrentAdapter(adapterID, callback) {

            // do not run the tests if adapter is not valid in current browser
            if(!VanillaStorage.isValid(adapterID) && adapterID !== 'local-storage-dummy') {
                return callback('Not valid: ' + adapterID);
            }

            describe('Abstraction: VanillaStorage Frontent implementing IDB or WebSQL under the hood', function() {

                before(function(done) {
                    this.isIndexedDBAdapter = /indexeddb/.test(adapterID);

                    // used key to store data for
                    this.KEY = 'tmp';

                    var storageOptions = {
                        adapterID: adapterID
                    };

                    this.vanilla = new VanillaStorage(storageOptions, function __readyToUseAPI(err) {
                        if(err) {
                            return log('ERROR STORAGE: ' + err);
                        }

                        // self.vanilla = this;
                        // done();

                        // cleanup before running tests
                        this.nuke(done);
                    });
                });

                describe('Basic CRUD (adapter: ' + adapterID + ')', function() {

                    it('should store data', function(done) {
                        this.vanilla.save(this.KEY, DEMO_DATA, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(DEMO_DATA.foo);
                            done();
                        });
                    });

                    it('should store lots of "rows"m for testing performance', function(done) {
                        var len = 200; // bei 100 websql in chrome bereits 4 secs !
                        var lenO = len;
                        var start;
                        var self = this;

                        function iter() {
                            self.vanilla.save(self.KEY, DEMO_DATA, function(err) {
                                expect(err).to.equal(null);

                                if(--len === 0) {
                                    var t = (window.__now() - start) / 1000;
                                    log('time storing ' + lenO + ' rows: ~' + window.round(t, 3) + 's');
                                    done();
                                }
                                else {
                                    iter();
                                }
                            });
                        }

                        start = window.__now();
                        iter();
                    });

                    it('should read data', function(done) {
                        this.vanilla.get(this.KEY, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(DEMO_DATA.foo);
                            done();
                        });
                    });

                    it('should delete data', function(done) {
                        var self = this;
                        this.vanilla.delete(this.KEY, function(err) {
                            if(err) {
                                log('ERROR', err);
                                return console.error(err);
                            }
                            expect(err).to.equal(null);

                            // really gone?
                            self.vanilla.get(self.KEY, function(err) {
                                // NO DATA FOUND
                                expect(typeof err).to.not.equal('undefined');
                                done();
                            });
                        });
                    });

                    it('should nuke all data', function(done) {
                        this.vanilla.nuke(function(err) {
                            expect(err).to.equal(null);
                            done();
                        });
                    });

                    it('should overwrite data', function(done) {
                        var dataToStore = {num: 42};
                        var self = this;
                        this.vanilla.save(this.KEY, dataToStore, function(err) {
                            expect(err).to.equal(null);

                            // this sometimes needs some time on IDB...
                            setTimeout(function() {
                                self.vanilla.get(self.KEY, function(err, data) {
                                    if(!data || !data.num) {
                                        console.error('SOMETHING IS WRONG HERE: adapterID: ' + adapterID, data, err);
                                    }
                                    expect(data.num).to.equal(42);

                                    // edit data directly and overwrite...
                                    data.foo = 'bar1';
                                    data.o = {};

                                    // again, same key but new data
                                    self.vanilla.save(self.KEY, data, function(err) {
                                        expect(err).to.equal(null);

                                        // this sometimes needs some time on IDB...
                                        setTimeout(function() {
                                            self.vanilla.get(self.KEY, function(err, dataOut) {
                                                if(err) {
                                                    log(err, 'error');
                                                }
                                                expect(dataOut.num).to.equal(42);
                                                expect(dataOut.foo).to.equal('bar1');
                                                expect(typeof dataOut.o).to.equal('object');
                                                done();
                                            });
                                        }, 250);
                                    });
                                });
                            }, 250);
                        });
                    });
                });

                describe('Advanced CRUD (adapter: ' + adapterID + ')', function() {
                    it('should save lots of data at once', function(done) {
                        if(!this.vanilla) {
                            return log('STORAGE-TESTS: No storage instance for adapterID=' + adapterID + ' ???');
                        }

                        var start = window.__now();

                        this.vanilla.save(this.KEY, {aString: BIG_STRING}, function(err, data) {
                            expect(err).to.equal(null);
                            expect(BIG_STRING).to.equal(data.aString);

                            // show some stats
                            var time = (window.__now() - start) / 1000;
                            log('It took ~' + window.round(time, 3) + 's to store ' + size/factor/factor +
                                'MB of data using the ' + adapterID + ' adapter');

                            done();
                        });
                    });
                    it('should read lots of data at once', function(done) {
                        var start = window.__now();

                        this.vanilla.get(this.KEY, function(err, data) {
                            expect(typeof data.aString).to.not.equal('undefined');

                            // show some stats
                            var time = (window.__now() - start) / 1000;
                            log('It took ~' + window.round(time, 3) + 's to read ' + size/factor/factor +
                                'MB of data using the ' + adapterID + ' adapter');

                            done();
                        });
                    });
                });

                describe('Error Handling (adapter: ' + adapterID + ')', function() {
                    it('should not save corrupted data', function(done) {
                        var data = {fn: function(a) {return a+2;}};
                        this.vanilla.save(this.KEY, data, function(err) {
                            expect(typeof err).to.equal('object');
                            done();
                        });
                    });

                    // NOTE: IDB needs objects to be saved, no primitives allowed...
                    // IDB error "Evaluating the object store's key path did not yield a value"
                    it('should not save numbers only on indexed db', function(done) {
                        var data = 42;
                        var self = this;
                        this.vanilla.save(this.KEY, data, function(err) {
                            if(self.isIndexedDBAdapter) {
                                expect(typeof err).to.equal('object');
                            }
                            else {
                                expect(err).to.equal(null);
                            }
                            done();
                        });
                    });
                    it('should not save bools only on indexed db', function(done) {
                        var data = false;
                        var self = this;
                        this.vanilla.save(this.KEY, data, function(err) {
                            if(self.isIndexedDBAdapter) {
                                expect(typeof err).to.equal('object');
                            }
                            else {
                                expect(err).to.equal(null);
                            }
                            done();
                        });
                    });
                    it('should not save strings only on indexed db', function(done) {
                        var data = 'Hello world';
                        var self = this;
                        this.vanilla.save(this.KEY, data, function(err) {
                            if(self.isIndexedDBAdapter) {
                                expect(typeof err).to.equal('object');
                            }
                            else {
                                expect(err).to.equal(null);
                            }
                            done();
                        });
                    });
                    // ---------------------------------------------------------

                    it('should automatically parse keys', function(done) {
                        var self    = this;
                        var vanilla = this.vanilla;
                        var dataIn  = {foo: 'bar111'};
                        var key     = '/:' + this.KEY + '/';

                        vanilla.save(key, dataIn, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(dataIn.foo);

                            // this sometimes needs some time on IDB...
                            setTimeout(function() {
                                vanilla.get(self.KEY, function(err, data) {
                                    if(!data || !data.foo) {
                                        console.error('SOMETHING IS WRONG HERE: adapterID: ' + adapterID, data, err);
                                    }

                                    expect(dataIn.foo).to.equal(data.foo);
                                    done();
                                });
                            }, 250);
                        });
                    });
                });

                describe('Cleaning up...', function() {
                    it('should nuke and finish', function() {
                        // just call the done callback now...
                        callback();
                    });
                });
            });
        }

        // *** tests for different adapters ***
        // only run the tests if the adapter is supported in the current env
        var adapterID;

        adapterID = 'indexeddb-storage';
        runSuiteForCurrentAdapter(adapterID, function() {
            log('OK. IndexedDB suite done.');

            // next:
            adapterID = 'websql-storage';
            runSuiteForCurrentAdapter(adapterID, function() {
                log('OK. WebSQL suite done.');

                // next:
                // unknown adapter-id -> will fallback to localStorage (-;
                adapterID = 'local-storage-dummy';
                runSuiteForCurrentAdapter(adapterID, function() {
                    log('OK. LocalStorage suite done.');
                });
            });
        });
    });
});

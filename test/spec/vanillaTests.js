/**
 * VanillaStorage.js testsuite
 *
 * There are 2 steps of testing:
 * -----------------------------
 * 1. we run a suite for each of the different adapters
 *    (= idb, websql, localStorage) in isolation
 * 2. we run a suite for the vanilla-frontend forcing each specified adapter
 *    behind the scenes by passing it as config
 *
 * This way we are testing all the @see [description] in isolation and together as a whole.
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    // This class...
    var VanillaStorage = require('VanillaStorage');

    // ...is using this two classes under the hood: (which we also test in
    // isolation here)
    var DEMO_DATA = {foo: 'bar'};
    var TMP_KEY   = 'some-key';

    // ~1MB demo json data, that's ok for testing via phantomjs...
    var LARGE_OBJECT = window.DEMO_JSON_FROM_FIXTURE_FILE;

    // ...but on real devices/browsers we want MORE:
    var ua          = navigator.userAgent.toLowerCase();
    var isPhantomjs = (/phantomjs/).test(ua);
    if(!isPhantomjs) {
        LARGE_OBJECT = [];
        for (var i = 0; i < 5; i++) { // ca 5mb
            LARGE_OBJECT.push(window.DEMO_JSON_FROM_FIXTURE_FILE);
        }
    }

    var LARGE_OBJECT_AS_STRING = JSON.stringify(LARGE_OBJECT);
    var LARGE_LEN   = LARGE_OBJECT_AS_STRING.length;
    var factor = 1024;

    // TODO refactor with better re-use method!

    describe('Basics', function() {
        it('should initialize with some adapter', function(done) {
            var storageOptions = {
                dbName: 'tmp',
                version: '1.0'
            };

            new VanillaStorage(storageOptions, function __readyToUseAPI(err) {
                expect(!err).to.equal(true);
                done();
            });
        });

        it('should call the callback with error if initializing idb or websql fails', function(done) {
            var storageOptions = {
                adapterID: 'not found'

                // hmm better way to make init process fail in websql and idb?
                // storeName: 'tmp?',
                // version: '0.0'
            };

            new VanillaStorage(storageOptions, function __readyToUseAPI(err) {
                expect(typeof err).to.equal('string');
                done();
            });
        });
    });


    // ----------- run for both adapters: idb and websql
    function runSuiteForCurrentAdapter(adapterID, callback) {

        // do not run the tests if adapter is not valid in current browser
        if(!VanillaStorage.isValid(adapterID) && adapterID !== 'local-storage') {
            return callback('Not valid: ' + adapterID);
        }

        describe('Abstraction: VanillaStorage Frontent implementing IDB or WebSQL under the hood', function() {

            before(function(done) {
                this.isIndexedDBAdapter = /indexeddb/.test(adapterID);

                log('========== STARTING TESTSUITE - useCompression? ' + window.__USE_COMPRESSION + '==========');

                var storageOptions = {
                    adapterID: adapterID,

                    useCompression: window.__USE_COMPRESSION
                };

                this.vanilla = new VanillaStorage(storageOptions, function __readyToUseAPI(err) {
                    if(err) {
                        return log('ERROR STORAGE: ' + err);
                    }

                    // cleanup before running tests
                    this.nuke(done);
                });
            });

            describe('Basic CRUD (adapter: ' + adapterID + ')', function() {

                it('should store data', function(done) {
                    this.vanilla.save(TMP_KEY, DEMO_DATA, function(err, data) {
                        expect(err).to.equal(null);
                        expect(data.foo).to.equal(DEMO_DATA.foo);
                        done();
                    });
                });

                it('should store lots of "rows" for testing performance', function(done) {
                    var len = 500; // bei 100 websql in chrome bereits 4 secs !
                    var lenO = len;
                    var start;
                    var self = this;

                    function iter() {
                        var key = TMP_KEY+'_'+len;

                        self.vanilla.save(key, DEMO_DATA, function(err) {
                            expect(err).to.equal(null);

                            if(--len === 0) {
                                var t = (window.__now() - start) / 1000;
                                log(adapterID + ': time storing ' + lenO + ' rows: ~' + window.round(t, 3) + 's');
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
                    this.vanilla.get(TMP_KEY, function(err, data) {
                        expect(err).to.equal(null);
                        expect(data.foo).to.equal(DEMO_DATA.foo);
                        done();
                    });
                });

                it('should delete data', function(done) {
                    var self = this;
                    this.vanilla.drop(TMP_KEY, function(err) {
                        if(err) {
                            log('ERROR', err);
                            return console.error(err);
                        }
                        expect(err).to.equal(null);

                        // really gone?
                        self.vanilla.get(TMP_KEY, function(err) {
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
                    this.vanilla.save(TMP_KEY, dataToStore, function(err) {
                        expect(err).to.equal(null);

                        // this sometimes needs some time on IDB...
                        setTimeout(function() {
                            self.vanilla.get(TMP_KEY, function(err, data) {
                                if(!data || !data.num) {
                                    console.error('SOMETHING IS WRONG HERE: adapterID: ' +
                                            adapterID, data, err);
                                }
                                expect(data.num).to.equal(42);

                                // edit data directly and overwrite...
                                data.foo = 'bar1';
                                data.o = {};

                                // again, same key but new data
                                self.vanilla.save(TMP_KEY, data, function(err) {
                                    expect(err).to.equal(null);

                                    // this sometimes needs some time on IDB...
                                    setTimeout(function() {
                                        self.vanilla.get(TMP_KEY, function(err, dataOut) {
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

                describe('Error/Exception Handling (adapter: ' + adapterID + ')', function() {
                    it('should not save corrupted data', function(done) {
                        var data = {fn: function(a) {return a+2;}};
                        this.vanilla.save(TMP_KEY, data, function(err) {
                            expect(typeof err).to.equal('object');
                            done();
                        });
                    });

                    // NOTE: IDB needs objects to be saved, no primitives allowed...
                    // IDB error "Evaluating the object store's key path did not yield a value"
                    it('should not save numbers only on indexed db', function(done) {
                        var data = 42;
                        var self = this;
                        this.vanilla.save(TMP_KEY, data, function(err) {
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
                        this.vanilla.save(TMP_KEY, data, function(err) {
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
                        this.vanilla.save(TMP_KEY, data, function(err) {
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
                        var vanilla = this.vanilla;
                        var dataIn  = {foo: 'bar111'};
                        var key     = '/:' + TMP_KEY + '/';

                        vanilla.save(key, dataIn, function(err, data) {
                            expect(err).to.equal(null);
                            expect(data.foo).to.equal(dataIn.foo);

                            // this sometimes needs some time on IDB...
                            setTimeout(function() {
                                vanilla.get(TMP_KEY, function(err, data) {
                                    if(!data || !data.foo) {
                                        console.error('SOMETHING IS WRONG HERE: adapterID: ' +
                                            adapterID, data, err);
                                    }

                                    expect(dataIn.foo).to.equal(data.foo);
                                    done();
                                });
                            }, 250);
                        });
                    });
                });
            });

            describe('Advanced CRUD (adapter: ' + adapterID + ')', function() {
                it('should save lots of data at once', function(done) {
                    if(!this.vanilla) {
                        return log('STORAGE-TESTS: No storage instance for adapterID=' + adapterID + ' ???');
                    }

                    var start = window.__now();

                    this.vanilla.save(TMP_KEY, LARGE_OBJECT, function(err/*, data*/) {
                        expect(err).to.equal(null);
                        // expect(BIG_STRING).to.equal(data.aString);

                        // show some stats
                        var time = (window.__now() - start) / 1000;
                        log('It took ~' + window.round(time, 3) + 's to store ' + LARGE_LEN/factor/factor +
                            'MB of data using the ' + adapterID + ' adapter');

                        done();
                    });
                });
                it('should read lots of data at once', function(done) {
                    var start = window.__now();

                    this.vanilla.get(TMP_KEY, function(err, data) {
                        expect(err).to.equal(null);
                        expect(typeof data).to.equal('object');
                        expect(JSON.stringify(data)).to.equal(LARGE_OBJECT_AS_STRING);

                        // show some stats
                        var time = (window.__now() - start) / 1000;
                        log('It took ~' + window.round(time, 3) + 's to read ' + LARGE_LEN/factor/factor +
                            'MB of data using the ' + adapterID + ' adapter');

                        done();
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

    // *** tests for frontend forcing different adapter backends ***
    // only run the tests if the adapter is supported in the current env
    var adapterID;

    adapterID = 'indexeddb-storage';
    runSuiteForCurrentAdapter(adapterID, function() {
        log('OK. IndexedDB suite done.');

        // next:
        adapterID = 'websql-storage';
        runSuiteForCurrentAdapter(adapterID, function() {
            log('OK. WebSQL suite done.');

            // same again with compression enabled (websql only)
            window.__USE_COMPRESSION = true;
            adapterID = 'websql-storage';
            runSuiteForCurrentAdapter(adapterID, function() {
                log('OK. WebSQL suite with compression enabled done.');
            });
        });
    });
});

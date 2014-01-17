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
 * This way we are testing all the things in isolation and together as a whole.
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    // This class...
    var VanillaStorage = require('VanillaStorage');

    // ...is using this two classes under the hood: (which we also test in
    // isolation here)
    var IDBStorage    = require('IDBStorage');
    var WebSQLStorage = require('WebSQLStorage');
    var LocalStorage  = require('LocalStorage');

    var DEMO_DATA = {foo: 'bar'};
    var TMP_KEY   = 'some-key';

    function getRandomBetween(min, max) {
        return parseInt(window.Math.random() * (max - min) + min, 10);
    }

    // generate some demo data
    var BIG_STRING = [];
    var LARGE_OBJECT = {};
    var LARGE_LEN;
    var factor = 1024;
    var size   = 1.0 * factor * factor;

    // TODO better? more tests, more data.
    // If phantomjs makes trouble, do it only in REAL browsers!
    var ua          = navigator.userAgent.toLowerCase();
    var isPhantomjs = (/phantomjs/).test(ua);

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

        // use 10 MB on real browsers, 2MB on PhantomJS
        var MAX = isPhantomjs ? 2 : 10;

        for(i = 0; i < MAX; i ++) {
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


    // ----- STEP #1 -----
    function runSuiteForAdapterInIsolation(adapterID, callback) {
        // do not run the tests if adapter is not valid in current browser
        if(!VanillaStorage.isValid(adapterID) && adapterID !== 'local-storage-dummy') {
            return callback('Not valid: ' + adapterID);
        }

        describe('Isolation :: ' + adapterID, function () {
            before(function(done) {
                switch(adapterID) {
                    case 'websql-storage':
                        this.adapter = new WebSQLStorage();
                        this.adapter.init(done);
                        break;
                    case 'indexeddb-storage':
                        this.adapter = new IDBStorage();
                        this.adapter.init(done);
                        break;
                    case 'local-storage-dummy':
                        this.adapter = new LocalStorage();
                        this.adapter.init(done);
                        break;
                    default:
                        throw 'No valid adapterID: ' + adapterID;
                }
            });

            it('should be initialized', function() {
                expect(typeof this.adapter).to.equal('object');
            });
            it('should store data', function(done) {
                var testData = ['hallo welt', {foo: 'bar'}];
                this.adapter.save(TMP_KEY, testData, function(err, data) {
                    expect(!!err).to.equal(false);
                    expect(data[0]).to.equal('hallo welt');
                    done();
                });
            });
            it('should read the stored data', function(done) {
                this.adapter.get(TMP_KEY, function(err, data) {
                    expect(!!err).to.equal(false);
                    expect(data[0]).to.equal('hallo welt');
                    expect(data[1].foo).to.equal('bar');
                    done();
                });
            });
            it('should delete the stored data', function(done) {
                var self = this;
                this.adapter.delete(TMP_KEY, function(err) {
                    if(err) {
                        console.error('DAAAAAAAAAAAAAAAAMN', err, adapterID);
                    }

                    expect(!!err).to.equal(false);

                    setTimeout(function() {
                        // really gone?
                        self.adapter.get(TMP_KEY, function(err, data) {
                            if(!err) {
                                console.error('DAAAAAAAAAAAAAAAAMN data found: ', data, adapterID);
                            }

                            expect(!!err).to.equal(true); // nothing found!
                            expect(typeof data).to.equal('undefined');
                            done();
                        });
                    }, 250);
                });
            });

            it('should store even more data', function(done) {
                var start = window.__now();
                var LEN = 1; // TODO figure out how to store more!
                var self = this;

                function it() {
                    self.adapter.save(TMP_KEY + '_' + LEN, LARGE_OBJECT,
                        function __saved(err) {
                            expect(!!err).to.equal(false);

                            var t = (window.__now() - start) / 1000;
                            log('Isolation ' + adapterID + ': stored ~' +
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

            it('should handle utf8 data', function(done) {
                var self = this;
                var ORIGINAL_UTF8_STR = 'Säft mÖchän liedööör not for €';
                var utf8String = ORIGINAL_UTF8_STR;

                // @see http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
                function encode_utf8(s) {
                    return window.unescape(encodeURIComponent(s));
                }
                function decode_utf8(s) {
                    return decodeURIComponent(window.escape(s));
                }
                utf8String = encode_utf8(utf8String);
                utf8String = decode_utf8(utf8String);
                expect(utf8String).to.equal(ORIGINAL_UTF8_STR);

                this.adapter.save(TMP_KEY, {str: utf8String}, function() {
                    self.adapter.get(TMP_KEY, function(err, data) {
                        expect(utf8String).to.equal(data.str);
                        // log(data.str)
                        done();
                    });
                });
            });

            // just call the done-callback
            it('should cleanup and finish', function(finish) {
                this.adapter.nuke(function() {
                    callback();
                    finish();
                });
            });
        });
    }

    // *** isolation tests of different adapter backends standalone ***
    runSuiteForAdapterInIsolation('indexeddb-storage', function() {
        runSuiteForAdapterInIsolation('websql-storage', function() {
            log('OK. Isolation tests done');
            doStep2();
        });
    });

    // ----- STEP #2 -----
    // we need to wait for the isolation tests to be executed
    function doStep2() {

        // ----------- run for both adapters: idb and websql
        function runSuiteForCurrentAdapter(adapterID, callback) {

            // do not run the tests if adapter is not valid in current browser
            if(!VanillaStorage.isValid(adapterID) && adapterID !== 'local-storage-dummy') {
                return callback('Not valid: ' + adapterID);
            }

            describe('Abstraction: VanillaStorage Frontent implementing IDB or WebSQL under the hood', function() {

                before(function(done) {
                    this.isIndexedDBAdapter = /indexeddb/.test(adapterID);

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
                        this.vanilla.delete(TMP_KEY, function(err) {
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
                });

                describe('Advanced CRUD (adapter: ' + adapterID + ')', function() {
                    it('should save lots of data at once', function(done) {
                        if(!this.vanilla) {
                            return log('STORAGE-TESTS: No storage instance for adapterID=' + adapterID + ' ???');
                        }

                        var start = window.__now();

                        this.vanilla.save(TMP_KEY, {aString: BIG_STRING}, function(err, data) {
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

                        this.vanilla.get(TMP_KEY, function(err, data) {
                            expect(typeof data.aString).to.not.equal('undefined');

                            // show some stats
                            var time = (window.__now() - start) / 1000;
                            log('It took ~' + window.round(time, 3) + 's to read ' + size/factor/factor +
                                'MB of data using the ' + adapterID + ' adapter');

                            done();
                        });
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

                // next:
                // unknown adapter-id -> will fallback to localStorage (-;
                adapterID = 'local-storage-dummy';
                runSuiteForCurrentAdapter(adapterID, function() {
                    log('OK. LocalStorage suite done.');
                });
            });
        });
    }
});

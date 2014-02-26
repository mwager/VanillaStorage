/**
 * VanillaStorage.js testsuite for the adapters in isolation
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(require) {
    'use strict';

    var VanillaStorage = require('VanillaStorage');
    var IDBStorage     = require('IDBStorage');
    var WebSQLStorage  = require('WebSQLStorage');
    var LZString       = require('lz_string');

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

    // TODO refactor with better re-use method!


    // ----- STEP #1 -----
    function runSuiteForAdapterInIsolation(adapterID, callback) {
        // do not run the tests if adapter is not valid in current browser
        if(!VanillaStorage.isValid(adapterID) && adapterID !== 'local-storage') {
            return callback('Not valid: ' + adapterID);
        }

        describe('Isolation :: ' + adapterID, function () {
            before(function(done) {
                switch(adapterID) {
                    case 'websql-storage':
                        this.adapter = new WebSQLStorage({
                            // inject the compressor object here manually
                            compressor: LZString
                        });
                        this.adapter.init(done);
                        break;
                    case 'indexeddb-storage':
                        this.adapter = new IDBStorage();
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
                this.adapter.drop(TMP_KEY, function(err) {
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

            // TODO more utf8/excoding tests?
            // see http://mathiasbynens.be/notes/javascript-unicode
            it('should handle utf8 data', function(done) {
                var self = this;
                var ORIGINAL_UTF8_STR = 'äöü € Δημιουργήθηκε';
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
                    setTimeout(function() { // wait a bit
                        self.adapter.get(TMP_KEY, function(err, data) {
                            expect(utf8String).to.equal(data.str);
                            // log(data.str)
                            done();
                        });
                    }, 500);
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
        });
    });
});

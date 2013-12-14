/**
* Global test setup, included in the test/index*.html files
*/
(function __globalHelpers() {
    'use strict';

    // global log helper and error handler for tests
    window.log = function() {
        if(!window.console || !window.console.log) {
            return false;
        }

        if(window.results && typeof arguments[1] !== 'boolean') {
            var span         = document.createElement('span');
            // span.style.color = color;
            span.innerHTML   = '[LOG '+ new Date().toString()+'] ' + arguments[0] + '<br>';
            window.results.appendChild(span);
            // window.results.appendChild(document.createElement('br'));
        }

        if(arguments[1] && arguments[1] === 'error' && window.console.error) {
            return window.console.error.apply(console, arguments);
        }
        window.console.log.apply(console, arguments);
    };

    window.onerror = function(err, file, line) {
        /*if(console.trace) {
            console.trace(err);
        }*/

        log('UNCAUGHT ERROR: ' + err + ' file: ' + file + ' line: ' + line);
        // return false;
    };

    // benchmarks
    window.__now = function() {
        if(!window.performance) {
            return new Date().getTime();
        }

        if(window.performance.now) {
            return window.performance.now();
        } else if(window.performance.mozNow) {
            window.performance.mozNow();
        } else if(window.performance.msNow) {
            window.performance.msNow();
        } else if(window.performance.oNow) {
            window.performance.oNow();
        } else if(window.performance.webkitNow) {
            window.performance.webkitNow();
        } else {
            return new Date().getTime();
        }
    };

    window.round = function(num, fac) {
        fac = (fac === '' || fac === 0 ? 1 : Math.pow(10, fac));
        num = Math.round(num * fac) / fac;
        return num;
    };

    // --- mocha config ---

    // mocha.ui('bdd');
    // mocha.reporter('html');
    // window.expect = window.chai.expect;

    window.mocha.assertionCounter = 0;

    // globally hook into expect
    window.expect = function (a) {
        window.mocha.assertionCounter++;

        if(window.mochaPhantomJS && window.mocha.assertionCounter % 50 === 0) {
            log(window.mocha.assertionCounter + ' assertions');
        }

        return window.chai.expect(a);
    };

    // window.should = window.chai.should(); THIS KILLS TESTEM CI BZW PHANTOMJS! -> STACK SIZE ERROR !
    // window.assert = window.chai.assert;

    // from http://robdodson.me/blog/2012/05/29/testing-backbone-modules/
    // ..."ignoreLeaks is useful because it’s easy for mocha to see jQuery or any other
    // global variable as a good reason to abort a test. IMO that’s what JSLint/Hint
    // is for, and bailing everytime you see a global is going to make testing 3rd
    // party code especially difficult."
    window.mocha.setup({
        timeout: 10000, // 60000 * 10, // 5 minutes, TODO später weniger ! Grund: storage tests
        ui: 'bdd',
        reporter: 'html',
        ignoreLeaks: true
    });
})();


require.config({
    // TODO cordova. baseUrl: window.__test_config__.requirejsBaseUrl,
    baseUrl: '../',

    // dev only:
    urlArgs: 'cb=' + Math.random(),

    // wichtig für mobile devices:
    waitSeconds: 60,

    deps: [

    ],

    paths: {
        VanillaStorage: './src/VanillaStorage',
        WebSQLStorage:  './src/WebSQLStorage',
        IDBStorage:     './src/IDBStorage',
        storageHelpers: './src/storageHelpers'
    },

    shim: {

    }
});


require([

],
function() {
    'use strict';

    var start;

    function allTestsDone() {
        var time = window.round( (window.__now() - start) / 1000, 2);

        log('***** SpecRunner: all tests done in ~' + time +
            's - # assertions: ' + window.mocha.assertionCounter + ' *****');

        document.getElementById('mocha-stats').innerHTML += ('<li>Assertions: <em>' +
            window.mocha.assertionCounter + '</em></li>');
    }

    // log(testSuite.specs)
    var specs = [
        'test/spec/storageTest'
    ];
    require(specs, function() {
        // on dom ready require all specs and run
        // document.addEventListener("DOMContentLoaded", function(/*event*/) {
        window.results = document.getElementById('results');

        var bootTests = function() {
            start = window.__now();

            if (window.mochaPhantomJS) {
                window.mochaPhantomJS.run(/*allTestsDone*/);
            }
            else {
                window.mocha.run(allTestsDone);
            }
        };
        bootTests();
        // });
    });
});


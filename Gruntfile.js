/* jshint maxlen: 10000*/

/**
 * VanillaStorage Gruntfile
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';
var log;            // jshint ignore:line
log = function() {  // jshint ignore:line
    console.log('LOG:');
    console.log.apply(console, arguments);
};

var lrSnippet, mountFolder;
lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// templateFramework: 'handlebars'

module.exports = function (grunt) {
    // TODO checkout more
    var browsers = [{
        browserName: 'iphone',
        platform: 'OS X 10.8',
        version: '6.1',
        'device-orientation': 'portrait'
    },
    {
        browserName: 'firefox',
        version: '19',
        platform: 'XP'
    }, {
        browserName: 'chrome',
        platform: 'XP'
    }, {
        browserName: 'chrome',
        platform: 'linux'
    },

    // IE:
    {
        browserName: 'internet explorer',
        platform: 'WIN8',
        'browser-version': '11'
    },
    {
        browserName: 'internet explorer',
        platform: 'WIN8',
        version: '10'
    }, {
        browserName: 'internet explorer',
        platform: 'VISTA',
        version: '9'
    },

    // opera:
    {
        browserName: 'opera',
        platform: 'Windows 2008',
        version: '12'
    }];

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var customConfig = {
        src: 'src',
        dist: 'dist'
    };

    grunt.initConfig({
        customConfig: customConfig,

        connect: {
            // starte eine node server in diesem verzeichnis...
            testserver: {
                options: {
                    port: 1234,
                    base: '.'
                }
            },
            options: {
                port: 1234,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },

        'saucelabs-mocha': {
            all: {
                options: {
                    testname: 'VanillaStorage.js mocha tests',
                    urls: ['http://mwager.github.io/VanillaStorage/test/'],
                    tunnelTimeout: 5,
                    // build: process.env.TRAVIS_JOB_ID,

                    browsers: browsers,
                    concurrency: 7,

                    tags: ['master']
                }
            }
        },

        // ...und starte 'mocha-phantomjs' gegen http://runningServer:PORT/test
        exec: {
            sleep: {
                cmd: 'sleep 50000',
            },
            mocha: {
                command:
                './node_modules/.bin/mocha-phantomjs http://localhost:<%= connect.testserver.options.port %>/test/',
                stdout: true
            },
            testem: {
                command: 'testem ci -P 5 -T 60',
                stdout: true
            }
        }, // end exec

        // all text-replace tasks
        replace: {
            testem: {
                src: ['./test/index.html'],
                dest: './test/index_testem.html',
                replacements: [{
                    from: '<!-- testem_includes_by_gruntfile -->',
                    to: '<script src="\/testem.js"><\/script>'
                }]
            }
        },

        // Require.js Optimizer Config
        requirejs: {
            compile: {
                options: {
                    name          : 'VanillaStorage',
                    baseUrl       : 'src',
                    // mainConfigFile: 'src/requirejs-config.js',
                    out           : 'dist/vanilla-storage.js',
                    paths: {
                        VanillaStorage: './VanillaStorage',
                        WebSQLStorage:  './WebSQLStorage',
                        IDBStorage:     './IDBStorage',
                        storageHelpers: './storageHelpers'
                    },

                    preserveLicenseComments: false,
                    useStrict: true,
                    wrap: true
                }
            }
        },
        /*requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: 'app/scripts',
                    optimize: 'none', // TODO!?

                    //paths: {
                    //    'templates': '../../.tmp/scripts/templates'
                    //},

                    // TODO: Figure out how to make sourcemaps work with grunt-usemin
                    // https://github.com/yeoman/grunt-usemin/issues/30
                    //generateSourceMaps: true,
                    // required to support SourceMaps
                    // http://requirejs.org/docs/errors.html#sourcemapcomments
                    preserveLicenseComments: false,
                    useStrict: true,
                    wrap: true,

                    //uglify2: {} || 'none' TODO! // https://github.com/mishoo/UglifyJS2

                    pragmasOnSave: {
                        //removes Handlebars.Parser code (used to compile template strings) set
                        //it to `false` if you need to parse template strings even after build
                        // excludeHbsParser : true,

                        // kills the entire plugin set once it's built.
                        // excludeHbs: true,

                        // removes i18n precompiler, handlebars and json2
                        // excludeAfterBuild: true
                    }
                }
            }
        },*/

        // express app
        express: {
            options: {
                // Override defaults here
                port: '9000'
            },
            dev: {
                options: {
                    script: 'server/app.js'
                }
            },
            prod: {
                options: {
                    script: 'server/app.js'
                }
            },
            test: {
                options: {
                    script: 'server/app.js'
                }
            }
        },

        // open app and test page
        open: {
            server: {
                path: 'http://localhost:<%= express.options.port %>'
            }
        },

        clean: {
            dist: ['.tmp', '<%= customConfig.dist %>/*'],
            server: '.tmp'
        }
    });


    // ---------- task definitions ----------
    // run the unit tests using mocha-phantomjs
    grunt.registerTask('test', [
        'clean:server',
        'connect:testserver',
        'exec:mocha'
    ]);
    grunt.registerTask('test-server', [
        'clean:server',
        'connect:testserver',
        'exec:sleep:10000'
    ]);

    grunt.registerTask('build', [
        'requirejs'
    ]);


    // TODO
    // $ export SAUCE_USERNAME=mwager
    // $ export SAUCE_ACCESS_KEY=API_KEY
    grunt.registerTask('test-sauce', [
        // 'connect:testserver',
        'saucelabs-mocha'
    ]);

    grunt.registerTask('testem', [
        'replace:testem',
        'exec:testem'
    ]);
};

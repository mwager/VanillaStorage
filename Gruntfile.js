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
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

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
    },

    {
        platform: 'linux',
        browserName: 'chrome'
    },
    {
        platform: 'linux',
        version: '4.0',
        // 'device-type' = "tablet"
        'device-orientation': 'portrait'
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

    // configurable paths
    var customConfig = {
        src: 'src',
        dist: 'dist'
    };

    grunt.initConfig({
        customConfig: customConfig,

        connect: {
            server: {
                options: {
                    base: '',
                    port: 9999
                }
            },

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

                    // hmm... rtm... TODO urls: ['http://127.0.0.1:9999/test/index.html'],
                    // problem with this: we need to merge the master into gh-pages everytime
                    // (but we still want to do this to make the tests available in public)
                    urls: ['http://mwager.github.io/VanillaStorage/test/'],
                    tunnelTimeout: 25,
                    build: process.env.TRAVIS_JOB_ID,

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
            rm_db_file: {
                cmd: 'rm -rf Databases.db'
            },
            mocha: {
                command:
                './node_modules/.bin/mocha-phantomjs http://localhost:<%= connect.testserver.options.port %>/test/',
                stdout: true
            },
            testem: {
                command: 'testem ci -P 5',
                stdout: true
            },
            generate_git_version_file: {
                command: 'echo $(git describe --abbrev=0) > version',
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
            /*version_in_test_index_html: {
                src: ['./test/index.html'],
                dest: './test/index.html',
                replacements: [{
                    from: '__VERSION__',
                    to: grunt.file.read('./version').trim()
                }]
            }*/
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
                        storageHelpers: './storageHelpers',

                        LocalStorage: '../bower_components/local-storage/src/LocalStorage'
                    },

                    preserveLicenseComments: true,
                    useStrict: true,
                    wrap: true
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
        'exec:rm_db_file',
        'clean:server',
        'connect:testserver',
        'exec:mocha'
    ]);
    grunt.registerTask('test-server', [
        'clean:server',
        'connect:testserver',
        'exec:sleep:10000'
    ]);

    /*
    grunt.registerTask('versioning', [
        'exec:generate_git_version_file',
        'replace:version_in_test_index_html'
    ]);
    */

    grunt.registerTask('build', [
        'requirejs',
        'versioning'
    ]);


    // TODO
    // $ export SAUCE_USERNAME=mwager
    // $ export SAUCE_ACCESS_KEY=API_KEY
    grunt.registerTask('test-sauce', [
        // 'connect:testserver',
        'connect:server',
        'saucelabs-mocha'
    ]);

    grunt.registerTask('testem', [
        'replace:testem',
        'exec:testem'
    ]);
};

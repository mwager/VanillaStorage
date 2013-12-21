/* jshint maxlen: 10000*/

/**
 * LocalStorage Gruntfile
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

    // configurable paths
    var customConfig = {
        src: 'src',
        dist: 'dist'
    };

    grunt.initConfig({
        customConfig: customConfig,

        connect: {
            // startup a node server in this directory...
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

        // ...und starte "mocha-phantomjs" gegen http://runningServer:PORT/test
        exec: {
            mocha: {
                command:
                './node_modules/.bin/mocha-phantomjs http://localhost:<%= connect.testserver.options.port %>/test',
                stdout: true
            },
            testem: {
                command: 'testem ci',
                stdout: true
            }
        }, // end exec

        // all text-replace tasks
        replace: {

        },

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
        },


        // TODO
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= customConfig.src %>',
                    dest: '<%= customConfig.dist %>',
                    src: [
                        // '*.{ico,txt}',
                        //'.htaccess',
                        //'images/**/*.{webp,gif,png,jpg,jpeg}',
                        //'bower_components/almond/almond.js'
                    ]
                }]
            }
        }
    });


    // ---------- task definitions ----------
    // run the unit tests using mocha-phantomjs
    grunt.registerTask('test', [
        'clean:server',
        'connect:testserver',
        'exec:mocha'
    ]);

    grunt.registerTask('testem', [
        'replace:testem',
        'exec:testem'
    ]);
};

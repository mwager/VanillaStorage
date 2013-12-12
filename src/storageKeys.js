/**
 * App-global storage keys (needed esp. for idb)
 *
 * @author Michael Wager <mail@mwager.de>
 */
define(function(/*require*/) {
    'use strict';

    return [
        'statisticsets',
        'statisticquestions',

        'questionnaires',
        'exams',
        'fsks',
        'categories',

        // must persist the language stuff
        'languages'
    ];
});

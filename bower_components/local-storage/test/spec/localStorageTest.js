/**
 * LocalStorage.js testsuite
 *
 * Shows you how to use it (-;
 */
define(function(require) {
    'use strict';

    var LocalStorage = require('src/LocalStorage');

    log('ye');

    describe('LocalStorage.js', function () {
        before(function() {
            this.ls = new LocalStorage();
        });

        it('should save and read data by key', function () {
            // 1. save
            this.ls.save('test', {foo: 'bar'});

            // 2. read and verify it was stored
            var data = this.ls.get('test');
            expect(data.foo).to.equal('bar');
        });

        it('should clear by key', function () {
            this.ls.save('tmp', 'tmp');

            expect(this.ls.get('tmp')).to.equal('tmp');

            this.ls.delete('tmp');

            expect(this.ls.get('tmp')).to.equal(null);
        });

        it('should clear all data in the storage', function () {
            this.ls.save('test1', 'test1');
            this.ls.save('test2', 'test2');

            this.ls.nuke();

            expect(this.ls.get('test1')).to.equal(null);
            expect(this.ls.get('test2')).to.equal(null);
        });

        it('should save stuff for fun and profit', function () {
            var ad = 'listening-to-music-is-good-for-you';

            // 1. save
            this.ls.save('foo', {advice: ad});

            // 2. read and verify it was stored
            var data = this.ls.get('foo');
            expect(data.advice).to.equal(ad);
        });



        describe('Limits', function () {
            before(function() {
                this.TOO_MUCH_DATA = {
                    arr:[]
                };

                for(var i = 0; i < 1000000; i++) {
                    this.TOO_MUCH_DATA.arr.push([1,2,3,4,5,6,7,8,9,0]);
                }
            });
            it('should pass the error in the callback if we save too much', function () {
                try {
                    this.ls.save('test', this.TOO_MUCH_DATA);
                }
                catch(e) {
                    expect(typeof e.name).to.equal('string'); //'QuotaExceededError'
                }
            });
        });
    });
});

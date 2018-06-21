'use strict';
const assert = require('power-assert');
const style = require('../../lib/tasks/style');
describe('style', function() {
    it('init',(done) => {
        style({src:'src/**/*.{scss,styl,stylus}',dest:'public'}).subscribe(() => {
            done();
        });
    });
});

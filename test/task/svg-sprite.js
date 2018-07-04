'use strict';
const assert = require('power-assert');
const sprite = require('../../lib/tasks/svg-sprite');
describe('svg-sprite', function() {
    it('init',(done) => {
        sprite({}).subscribe(() => {
            done();
        });
    });
});

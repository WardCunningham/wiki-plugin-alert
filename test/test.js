// build time tests for alert plugin
// see http://mochajs.org/

(function() {
  const alert = require('../client/alert'),
        expect = require('expect.js');

  describe('alert plugin', () => {
    describe('expand', () => {
      it('can make itallic', () => {
        var result = alert.expand('hello *world*');
        return expect(result).to.be('hello <i>world</i>');
      });
    });
  });

}).call(this);

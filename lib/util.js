/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

exports.pp = function() {
    var util = require('util');
    var args = Array.prototype.slice.call(arguments);
    
    args.forEach(function(arg) {
        if ( typeof args == 'string' ) {
            util.debug(' ======== ' + arg);
        } else {
            util.debug(util.inspect(arg));
        }
    });
};

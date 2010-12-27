/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

exports.pp = function() {
    var util = require('util');
    var args = Array.prototype.slice.call(arguments);

    args.forEach(function(arg) {
        if ( typeof args === 'string' ) {
            util.debug(' ======== ' + arg);
        } else {
            util.debug("\n" + typeof arg + "\n" + util.inspect(arg));
        }
    });
};

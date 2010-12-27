/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

// I do not like modifying global prototypes.. but I will make an exception in this case
Date.prototype.rfc822date = function() {
    var weekday_name = { 0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6: 'Sat' };
    var month_name = { 0:'Jan', 1:'Feb', 2:'Mar', 3:'Apr', 4:'May', 5:'Jun', 6: 'Jul', 7:'Aug', 8:'Sep', 9:'Oct', 10:'Nov', 11:'Dec' };

    // argh.. rfc822 requires digits to be zero prefixed
    var zeropad = function(num, length) {
        if ( length === undefined ) {
            length = 2;
        }

        var add = length - num.toString().length;
        var zeros = '';
        for (var i = 0; i < add; i+=1 ) {
            zeros += '0';
        }
        return zeros + num;
    };
    
    return weekday_name[this.getUTCDay()] + ', ' +
    this.getUTCDate() + ' ' +
    month_name[this.getUTCMonth()] + ' ' +
    this.getUTCFullYear() + ' ' +
    zeropad(this.getUTCHours()) + ':' +
    zeropad(this.getUTCMinutes()) + ':' +
    zeropad(this.getUTCSeconds()) + ' UTC';
};

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

// I don't like modifying global prototypes.. but I'll make an exception in this case
Date.prototype.rfc822date = function() {
    var weekday_name = { 0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6: 'Sat' };
    var month_name = { 0:'Jan', 1:'Feb', 2:'Mar', 3:'Apr', 4:'May', 5:'Jun', 6: 'Jul', 7:'Aug', 8:'Sep', 9:'Oct', 10:'Nov', 11:'Dec' };

    var zeropad = function(num, length) {
        if ( length === null ) {
            length = 2;
        }

        add = length - num.toString().length;
        zeros = '';
        for (var i = 0; i < add; i++ ) {
            zeros = zeros + '0';
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


// system libraries
var fs = require('fs');

// our own libraries
var APP_MODULES = require(__dirname + '/lib');

// I don't like modifying global prototypes.. but I'll make an exception in this case
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
        for (var i = 0; i < add; i++ ) {
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

// load our configuration
try {
  var configJSON = fs.readFileSync(__dirname + '/config.json');
  config = JSON.parse(configJSON.toString());
} catch(e) {
  console.log("File /config.json not loadable");
}

// lets start the modules we need to start
if ( process.argv[2] in APP_MODULES ) {
    console.log('Running module: ' + process.argv[2]);
    console.log('Arguments: ' + process.argv.slice(3));
    var APP = APP_MODULES[process.argv[2]];
    APP.config = config;
    APP.run(process.argv.slice(3));
} else {
    console.log(process.argv[2] + ' is not available in APP_MODULES');
}

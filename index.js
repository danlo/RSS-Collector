/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

// system libraries
var fs = require('fs');
var util = require('util');

// our own libraries
var APP_MODULES = require(__dirname + '/lib');
var config = require(__dirname + '/lib/config').load(__dirname + '/config.yaml');

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

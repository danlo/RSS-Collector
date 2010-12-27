/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require */
"use strict";

// system libraries
var fs = require('fs');
var util = require('util');
var process = require('process');

(function() {
    // our own libraries
    var APP_MODULES = require(__dirname + '/lib'),
        config = require(__dirname + '/lib/config').load(__dirname + '/config.yaml');

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
}());

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

(function() {
    // our own libraries
    var APP_MODULES = require(__dirname + '/lib'),
        config = require(__dirname + '/lib/config').load(__dirname + '/config.yaml');
    
    if ( process.argv[2] === undefined ) {
        var app;
        for (var i in APP_MODULES) {
            if ( APP_MODULES.hasOwnProperty(i) ) {
                util.debug('processing: ' + i);
                app = APP_MODULES[process.argv[i]];
                util.debug(util.inspect(app));
                app.config = config;
                console.log(app.help());
            }
        }
    } else {
        if ( process.argv[2] in APP_MODULES ) {
            console.log('Running module: ' + process.argv[2]);
            console.log('Arguments: ' + process.argv.slice(3));
            var APP = APP_MODULES[process.argv[2]];
            APP.config = config;
            APP.run(process.argv.slice(3));
        } else {
            console.log(process.argv[2] + ' is not available in APP_MODULES');
        }
    }
}());

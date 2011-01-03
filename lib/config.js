/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
"use strict";

// load our configuration
var fs = require('fs');
var pp = require('./util').pp;

exports.load = function(config_file) {
    var file = fs.realpathSync(config_file);
    var config = false;
    try {
        var yaml = require('yaml');
        var buffer = fs.readFileSync(file).toString();
        config = yaml.eval(buffer);
        config.copy = function() {
            return yaml.eval(buffer);
        }
    } catch(e) {
        pp(e);
        console.log("File " + config_file + " not loadable");
        process.exit(1);
    }

    return config;
};

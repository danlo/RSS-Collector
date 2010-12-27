/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var message = require('lib/message.js'),
    redis = require('redis'),
    util = require('util'),
    pp = require('lib/util.js').pp,
    fs = require('fs'),
    services = require('lib/index.js'),
    config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

exports.dump = function(test) {
    var service = new services.Dump();
    service.config = config;
    service.run();
    service.end();
    test.ok(true);
    test.done();
};

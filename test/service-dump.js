/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

var message = require('lib/message.js');
var redis = require('redis');
var util = require('util');
var pp = require('lib/util.js').pp;
var fs = require('fs');
var config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

exports.dump = function(test) {
    var APP_MODULES = require('lib/index.js');
    var service = APP_MODULES.dump;
    service.config = config;
    service.run();
    service.end();
    test.ok(true);
    test.done();
};

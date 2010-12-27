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
    config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

exports.listener = function(test) {
    // setup listener before hand
    var APP_MODULES = require('lib/index.js'),
        service = APP_MODULES.listener;

    service.config = config;
    service.run();

    var redis = require('redis'),
        client = redis.createClient(config.redis.port, config.redis.host);

    client.on('connect', function() {
        var mesg = new message.Message();
        mesg.bulk_assign( { data: 'test message', category: 'TESTING', command: message.DATA } );

        client.publish(config.redis_keys.channel, mesg.toJSON());
        client.quit();
        client.end();
        service.end();
        test.ok(true, 'nothing to test');
        test.done();
    });
};


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

exports.say = function(test) {
    // setup listener before hand
    var client = redis.createClient(config.redis.port, config.redis.host);

    var fail_safe = setTimeout( function() { 
        test.ok(false, "timeout called in test: say"); 
        test.done(); 
    }, 2*1000 );

    // monitor for quit request
    var client_monitor = redis.createClient(config.redis.port, config.redis.host);
    client_monitor.on('message', function(channel, new_message) {
        var msg = new message.Message();
        msg.parseJSON(new_message);
        if ( msg.command === message.QUIT ) {
        } else if ( msg.command === message.DATA ) {
            test.ok(true, 'message received');
            client_monitor.end();
            clearTimeout(fail_safe);
            test.done();
        }
    });
    client_monitor.on('connect', function() {
        client_monitor.subscribe(config.redis_keys.channel);
        
        var APP_MODULES = require('lib/index.js'),
            service = APP_MODULES.say;
        service.config = config;
        service.run('this is a test');
        service.end();
    });
};


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

exports.accept_http_input = function(test) {
    // setup listener before hand
    var client = redis.createClient(config.redis.port, config.redis.host);

    var fail_safe = setTimeout( function() { 
        test.ok(false, "timeout called in test: accept_http_input2"); 
        test.done(); 
    }, 2*1000 );

    var test_count = 2;
    test.expect(2);

    // monitor for data request
    var client_monitor = redis.createClient(config.redis.port, config.redis.host);
    client_monitor.on('message', function(channel, new_message) {
        var msg = new message.Message();
        msg.parseJSON(new_message);
        if ( msg.command !== message.QUIT ) {
            test.ok(true, 'message received');
            test_count -= 1;
        }
    });

    var APP_MODULES = require('lib/index.js');
    var service = APP_MODULES.accept_http_input;
    service.config = config;
    service.run();

    client_monitor.on('connect', function() {
        client_monitor.subscribe(config.redis_keys.channel);
        
        var request = require('request');
        request(
            {uri:'http://' + config.http_server_input.host + ':' + config.http_server_input.port + '/command=DATA&data=this%20is%20a%20test2' }, 
            function (error, response, body) {
                test_count-=1;
                if (!error && response.statusCode === 200) {
                    test.ok(true, 'message sent');
                } else {
                    test.ok(false, 'message failed to send');
                }                
            }
        );
    });

    var max_tries = 20;
    var timer;
    var wait = function() {
        if ( max_tries === 0) {
            test_count = 0;
        } else {
            max_tries -= 1;
        }
        
        if ( test_count === 0 ) {
            test.done();
            client_monitor.end();
            service.end();
            clearTimeout(timer);
            clearTimeout(fail_safe);
        }
        timer = setTimeout(wait, 100);
    };
    wait();
};

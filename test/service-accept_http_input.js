/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

var message = require('lib/message.js');
var redis = require('redis');
var util = require('util');
var pp = require('lib/util.js').pp;
var fs = require('fs');

// load our configuration
var config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

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
        if ( msg.command != message.QUIT ) {
            test.ok(true, 'message received');
            test_count --;
        }
    });

    client_monitor.on('connect', function() {
        client_monitor.subscribe(config.redis_keys.channel);
        
        var APP_MODULES = require('lib/index.js');
        service = APP_MODULES.accept_http_input;
        service.config = config;
        service.run();
        
        var request = require('request');
        request(
            {uri:'http://' + config.http_server_input.host + ':' + config.http_server_input.port + '/command=DATA&data=this%20is%20a%20test2' }, 
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    test.ok(true, 'message sent');
                    test_count --;
                } else {
                    test.ok(false, 'message failed to send');
                    test_count--;
                }                
            }
        );
    });

    var max_tries = 20;
    var timer;
    var wait = function() {
        if ( max_tries-- === 0) {
            test_count = 0;
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

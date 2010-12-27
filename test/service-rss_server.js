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

exports.rss_server = function(test) {
    test.expect(1);
    
    // setup listener before hand
    var client = redis.createClient(config.redis.port, config.redis.host); 

    var fail_safe = setTimeout( function() { 
        test.ok(false, "timeout called in test: rss_server"); 
        test.done(); 
    }, 2*1000 );

    var APP_MODULES = require('lib/index.js'),
        service = APP_MODULES.rss_server;

    service.config = config;
    service.run();

    var request = require('request');
    request(
        { uri:'http://' + config.http_server_rss.host + ':' + config.http_server_rss.port + '/' }, 
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                test.ok(true, 'message sent');
            } else {
                test.ok(false, 'Error: (' + error + ') ' + response.statusCode);
            }
            service.end();
            test.done();
        }
    );
};

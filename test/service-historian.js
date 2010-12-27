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

exports.historian = function(test) {
    // setup listener before hand
    var client = redis.createClient(config.redis.port, config.redis.host);

    // post a message once we get a connection
    client.on('connect', function() {
        var msg = new message.Message();
        msg.bulk_assign( { data: "this is a test 3", category: 'command line', command: message.DATA} );
        client.publish(config.redis_keys.channel, msg.toJSON());
        client.quit();
        client.end();
    });
    test.done();
};

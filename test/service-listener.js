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

exports.listener = function(test) {
    // setup listener before hand
    var APP_MODULES = require('lib/index.js');
    var service = APP_MODULES.listener;
    service.config = config;
    service.run();
    
    var redis = require('redis');
    var client = redis.createClient(config.redis.port, config.redis.host);

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


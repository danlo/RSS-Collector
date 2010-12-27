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

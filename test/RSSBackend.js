/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var message = require('lib/message.js'),
    backend = require('lib/RSSBackend.js'),
    redis = require('redis'),
    util = require('util'),
    pp = require('lib/util.js').pp,
    fs = require('fs'),
    config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

function createBackend() {
    return new backend.RSSBackend(config);
}

exports.factory = function(test) {
    test.expect(1);
    test.ok(typeof createBackend() == 'object');
    test.done();
};

exports.make_key = function(test) {
    var backend = createBackend();

    var keyMake,
        guid = "12345";
    
    var parts = [];

    // test itemKey, makeKey
    parts.push(config.redis_keys.prefix);
    parts.push(config.redis_keys.item_prefix);
    parts.push(guid);
    keyMake = parts.join(config.redis_keys.join);
    test.equals(keyMake, backend.itemKey(guid));
    
    test.equals(keyMake, backend.makeKey(config.redis_keys.item_prefix, guid));
    
    test.equals(keyMake, backend.makeKey('item_prefix', guid));
    
    var msg = new message.Message({ 'guid': guid });
    test.equals(keyMake, backend.itemKey(msg));

    // test configKey, historyKey
    parts = [];
    parts.push(config.redis_keys.prefix);
    parts.push(config.redis_keys.history_key);
    keyMake = parts.join(config.redis_keys.join);
    test.equals(keyMake, backend.makeKey('history_key'));
    test.equals(keyMake, backend.historyKey());

    backend.end();
    test.done();
};

exports.connection = function(test) {
    var backend = createBackend();
    
    backend.setConnection('wee');
    test.equals(backend.getConnection(), 'wee');
    
    backend.setConnection(undefined);
    test.ok(typeof backend.getConnection() === 'object');
    
    backend.end();
    test.done();
};

exports.crud = function(test) {
    var backend = createBackend();
    
    var guid = '12345',
        msg = new message.Message( { 'guid': guid, category: 'testing' } );

    backend.setItem(msg, function() {
        var msg2 = backend.getItem(guid, function() {
            test.equals(msg.guid, msg2.guid);
        });
    });

    backend.end();
    test.done();
};

exports.basic = function(test) {
    var backend = createBackend();
    
    backend.end();
    test.done();
};

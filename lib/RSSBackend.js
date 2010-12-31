/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var util = require('util'),
    pp = require('./util').pp;

require('./date');

/**
* CRUD for RSS.  This Creates (Add), Read, Updates, and Deletes RSS messages from the system
*/
function RSSBackend(config) {
    var self = this;
    self.connection = null;
    self.message = require('./message');
    self.config = config; // you are welcome to pass in your own set_redis, but if you don't...

    /*
    * @param {Arguments} arguments a list of strings to be used.  
    *   if a string matches a config.redis_keys.property name; then the config.redis_keys.property value is used.
    * @return {String}
    */
    self.makeKey = function() {
        var key = [];
        key.push(self.config.redis_keys.prefix);
        for ( var i = 0; i < arguments.length; i+=1 ) {
            var lookup = arguments[i];
            if ( self.config.redis_keys.hasOwnProperty(lookup) ) {
                key.push(self.config.redis_keys[lookup]);
            } else {
                key.push(lookup);
            }
        }
        return key.join(self.config.redis_keys.join);
    };
    
    self.configKey = function(name) {
        var key = self.makeKey(name);
    };
    
    self.historyKey = function () {
        return self.makeKey('history_key');
    };
    
    self.itemKey = function(msg) {
        var key;
        if (typeof msg === 'string' ) {
            key = self.makeKey('item_prefix', msg);
        } else {
            key = self.makeKey('item_prefix', msg.guid);
        }
        return key;
    };

    /* directly set the connection
    * @param {redisClientConnection} connection
    * @return {this}
    */
    self.setConnection = function(connection) {
        self.connection = connection;
        return self;
    };
    
    /* returns the current connection. Creates a new one if the current one is undefined
    * @return {redisConnection}
    */
    self.getConnection = function() {
        if ( ! self.connection ) {
            var redis = require('redis');
            self.connection = redis.createClient(self.config.redis.port, self.config.redis.host);
        }
        
        return self.connection;
    };
    
    /*
    * @param {Message} msg the message to be added
    * @return {this}
    */
    self.setItem = function(msg, callback) {
        var obj = msg.extract_message_data();

        // add object to backend
        if ( callback === undefined ) {
            self.getConnection().hmset(self.itemKey(msg), obj, function(status) {
                callback(status);
            });
        } else {
            self.getConnection().hmset(self.itemKey(msg), obj);
        }

        // add msg.guid to history
        self.getConnection().lpush(self.historyKey(), msg.guid, function(err, reply) {
            if (parseInt(reply, 10) > self.configKey('history_max_count')) {
                self.trimHistory(); // trim, key is too long
            }
        });

        return self;
    };
    
    /*
    * @param {String} guid
    * @return {Message|other} returns a new message if no call back, or returns the result of the call ack
    */
    self.getItem = function(guid, callback) {
        // add object to backend
        if ( callback === undefined ) {
            self.getConnection().hgetall(self.itemKey(guid), function(err, obj) {
                return new self.message.Message(obj);
            });
        } else {
            self.getConnection().hgetall(self.itemKey(guid), function(err, obj) {
                return callback(err, obj);
            });
        }
    };
    
    self.getAllItems = function() {
        var list = [];
        self.getConnection().lrange(self.configKey('history_key'), 0, -1, function(err, reply) {
            for (var i = 0; i < reply.length; i+=1) {
                self.getConnection().push(self.readItem(reply[i]));
            }
            return list;
        });
    };
        
    self.deleteItem = function(guid) {
        self.getConnection().del(self.itemKey(guid));
    };
    
    self.trimHistory = function() {
        self.getConnection().lrange(self.history_key(), self.configKey('history_max_count') - 1, 999, function(err, reply) {
            for (var i = 0; i < reply.length; i+=1) {
                self.deleteItem(reply[i]);
            }
            self.getConnection().ltrim(self.historyKey(), 0, self.configKey('history_max_count') - 1);
        });
    };
    
    self.end = function() {
        if ( self.connection ) {
            self.getConnection().quit();
            self.getConnection().end();
        }
        return self;
    };

    return self;
}
exports.RSSBackend = RSSBackend;

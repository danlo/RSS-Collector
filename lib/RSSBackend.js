/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var util = require('util'),
    pp = require('./util').pp,
    message = require('lib/message');

require('./date');

/**
* CRUD for RSS.  This Creates (Add), Read, Updates, and Deletes RSS messages from the system
*/
function RSSBackend(config) {
    var self = this;
    self.debug = true;
    self.redis_debug = false;
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
            redis.debug_mode = self.redis_debug;
            self.connection = redis.createClient(self.config.redis.port, self.config.redis.host);
            if (self.debug) {
                console.log('created redis connection to redis://' + self.config.redis.host + ':' + self.config.redis.port + '/');
            }
        }
        
        return self.connection;
    };
    
    /*
    * @param {Message} msg the message to be added
    * @param {Function} callback no parameters
    * @return {this}
    */
    self.set = function(msg, callback) {
        var obj = msg.extract_message_data(),
            key = self.itemKey(msg);

        if (self.debug) {
            console.log('setItem called key=' + self.itemKey(msg));
        }
        // add object to backend
        if ( callback === undefined ) {
            self.getConnection().hmset(self.itemKey(msg), obj);
            self.history.add(msg);
        } else {
            self.getConnection().hmset(self.itemKey(msg), obj, function(status) {
                self.history.add(msg, callback());
            });
        }

        return self;
    };
    
    /*
    * @param {String} guid
    * @param {Function(err,obj)} callback
    * @return {Message|other} returns a new message if no call back, or returns the result of the call back
    */
    self.get = function(guid, callback) {
        // add object to backend
        if (self.debug) {
            console.log('getItem called key=' + self.itemKey(guid));
        }
        self.getConnection().hgetall(self.itemKey(guid), function(err, reply) {
            // convert reply into message
            callback(err, new message.Message(reply));
        });
    };

    /*
    * @param {Function(err,obj)} callback
    * @return {Message|other} returns a new message if no call back, or returns the result of the call back
    */
    self.getAll = function(callback) {
        // get list of keys
        self.getConnection().lrange(self.historyKey(), 0, -1, function(err, reply) {
            if (self.debug) {
                console.log('getAll called supplied ' + reply.length + ' guids');
            }
            if ( reply.length === 0 ) {
                callback(err,[]);
                return self;
            }
            // setup request to get keys all at once
            var multi = self.getConnection().multi();
            reply.forEach(function(i) { multi.hgetall(reply[i]) } );
            
            // now get all of those keys
            multi.exec(function(err, replies) {
                if (self.debug) {
                    console.log('getAll got ' + replies.length + ' hashes');
                }

                var counter = 0,
                    list = [];

                // place them into an array
                if ( replies === 0 ) {
                    // make sure call back is called, regardless, even if we pass in an empty list
                    callback(list);
                } else {
                    replies.forEach(function(err, reply) {
                        self.getItem(rely[i], function(msg) {
                            list.push(msg);
                            counter += 1;
                            if ( counter === replies.length ) {
                                callback(list);
                            }
                        });
                    }); // replies.forEach
                }
            }); // multi.exec
        }); // lrange
    };

    self.del = function(guid) {
        if (self.debug) {
            console.log('delete called key=' + self.itemKey(guid));
        }
        
        // delete the item
        self.getConnection().del(self.itemKey(guid));
        
        self.history.del(guid);
    };
    
    self.history = {
        del: function(guid, callback) {
            if (self.debug) {
                console.log('history.del called key=' + self.itemKey(guid));
            }
            // delete the item from the list
            self.getConnection().lrem(self.historyKey(), 1, self.itemKey(guid), callback);
            
            return self;
        },
    
        add: function(msg, callback) {
            // remove the item, and then add it back in at the FRONT
            self.history.del(msg, function() {
                console.log('called history.del.callback - adding key');
                // add msg.guid to history
                self.getConnection().lpush(self.historyKey(), msg.guid, function(err, reply) {
                    if (self.debug) {
                        console.log('hitory.add called key=' + self.itemKey(msg) + ' there are ' + reply + ' guids in the history');
                    }
                    if (parseInt(reply, 10) > self.makeKey('history_max_count')) {
                        self.trimHistory(); // trim, key is too long
                    }
                    if (callback) {
                        console.log('calling history.add.callback');
                        callback();
                    }
                });
            });
        },

        trim: function() {
            if (self.debug) {
                console.log('history.trim called');
            }
            self.getConnection().lrange(self.history_key(), self.makeKey('history_max_count') - 1, 999, function(err, reply) {
                for (var i = 0; i < reply.length; i+=1) {
                    self.del(reply[i]);
                }
                self.getConnection().ltrim(self.historyKey(), 0, self.makeKey('history_max_count') - 1);
            });
        }
    };

    // purge
    self.purge = function(guid) {
        if (self.debug) {
            console.log('purge called');
        }
        self.del(self.makeKey('channel'));
        self.del(self.historyKey());
        self.del(self.makeKey('history_duration'));
        self.del(self.makeKey('history_max_count'));
    };

    // end
    self.end = function() {
        if ( self.connection ) {
            if (self.debug) {
                console.log('closing redis connection');
            }
            self.getConnection().quit();
            self.getConnection().end();
        }
        return self;
    };

    return self;
}
exports.RSSBackend = RSSBackend;

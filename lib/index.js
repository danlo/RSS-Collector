/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

var redis = require('redis');
var util = require('util');
var message = require('./message');
var pp = require('./util').pp;
require('./date');

/**
* Dump redis history and info to console
*/
exports.dump = { 
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    run: function() {
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);
        var self = this;
        
        self.end = function() {
            client.quit();
            client.end();
        };
        
        client.llen(this.config.redis_keys.history_key, function(err, reply) {
            console.log('We are listening to redis server: ' + self.config.redis.port + ':' + self.config.redis.host);
            console.log('The redis channel we are listening to is: ' + self.config.redis_keys.channel);
            var count = parseInt(reply, 10);
            console.log('There are ' + count + ' items stored in the history; history_key = ' + self.config.redis_keys.history_key);

            client.lrange(self.config.redis_keys.history_key, 0, -1, function(err, reply) {
                for (var i = 0; i < reply.length; i++) {
                    console.log(reply[i]);
                }
                self.end();
            });
        });
    }
};

/**
* Send a quick message out via redis
*/
exports.say = { 
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);

        var message_string = Array.prototype.slice.call(arguments).join(' ');
        var self = this;

        client.on('connect', function() {
            var mesg = new message.Message();
            mesg.bulk_assign( { data: message_string, category: 'command line', command: message.DATA} );
            
            var json = mesg.toJSON();
            console.log('Sending 1 messages to channel: ' + self.config.redis_keys.channel + ' message: ' + json);
            client.publish(self.config.redis_keys.channel, json);
            client.quit();
            client.end();
        });
    }
};

/**
* Accept POST/GET requests and insert into the redis pub-sub model
*/ 
exports.accept_http_input = {
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    run: function() {
        var http = require('http');
        var url = require('url');
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);
        var self = this;

        // server actions
        var server = http.createServer();
        server.on('request', function (req, res) {
            if ( req.method == 'GET' ) {
                // get the query parts and assign them to msg
                parts = url.parse(req.url, true);
                var msg = new message.Message();
                msg.bulk_assign(parts.query);
                
                // save message
                client.publish(self.config.redis_keys.channel, msg.toJSON());
                
                // signify that we have recieved the content.
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('GET Received.\n');

                if ( msg.command == message.QUIT ) {
                    self.end();
                }
            } else if ( req.method == 'POST' ) {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('POST Received.\n');
            }
        });

        // monitor for quit request
        var client_monitor = redis.createClient(self.config.redis.port, self.config.redis.host);
        client_monitor.on('connect', function() {
            client_monitor.subscribe(self.config.redis_keys.channel);
        });
        client_monitor.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            if ( msg.command == message.QUIT ) {
                self.end();
            }
        });

        // this is how we close
        self.end = function() {
            client.quit();
            client.end();
            client_monitor.quit();
            client_monitor.end();
            server.close();
        };

        server.listen(this.config.http_server_input.port, this.config.http_server_input.host);
        console.log('HTTP Input Server running at http://' + this.config.http_server_input.host + ':' + this.config.http_server_input.port + '/');
    }
};

/* 
* listener does nothing but listen to the pub-sub in redis and display the message to console
* This is useful for debugging
*/
exports.listener = { 
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);

        var self = this;
        client.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            console.log('listener recieved: ' + msg._raw );
            if (msg.command == message.QUIT) { 
                self.end();
            }
        });

        // end
        self.end = function() {
            client.unsubscribe();
            client.quit();
            client.end();
        };

        client.subscribe(this.config.redis_keys.channel);
        console.log('Listening to: ' + this.config.redis_keys.channel);
    }
};

/*
* historian listens to the pub-sub channel and stores it into the history
*/
exports.rss_server = {
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    /* rss_header produces the rss header
     * @param {http.ServerResponse} res
     * @param {Date} date
     */
    rss_header: function(res, date) {
        res.write('<?xml version="1.0" encoding="UTF-8" ?>' + "\n");
        res.write('<rss version="2.0">' + "\n");
        res.write('<channel>' + "\n");
        res.write('<title>' + this.config.rss.title + '</title>' + "\n");
        // res.write('<description>This is an example of an RSS feed</description>' + "\n");
        res.write('<link>https://github.com/danlo</link>' + "\n");
        res.write('<lastBuildDate>' + date.rfc822date() + '</lastBuildDate>' + "\n");
        res.write('<pubDate>' + date.rfc822date() + '</pubDate>' + "\n");
    },

    /* rss_header produces the rss footer
     * @param {http.ServerResponse} res
     */
    rss_footer: function(res) {
        res.write('</channel>' + "\n");
        res.write('</rss>' + "\n");
    },

    /* rss_header produces the rss footer
     * @param {http.ServerResponse} res
     * @param {Message} msg
     */
    rss_format: function(res, msg) {
        res.write('<item>' + "\n");
        res.write('<title>' + msg.category + ' / ' + msg.command + '</title>' + "\n");
        res.write('<description>' + msg.data + '</description>' + "\n");
        // res.write('<link>N/A</link>' + "\n");
        res.write('<guid>' + msg.guid + '</guid>' + "\n");
        res.write('<pubDate>' + msg.eventDate.rfc822date() + '</pubDate>' + "\n");
        res.write('</item>' + "\n");
    },

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);            

        var self = this;

        var http = require('http');
        var server = http.createServer(function (req, res) {
            client.lrange(self.config.redis_keys.history_key, 0, -1, function(err, reply) {
                res.writeHead(200, {'Content-Type': 'application/rss+xml'});
                self.rss_header(res, new Date());
                for (var i = 0; i < reply.length; i++) {
                    var msg = new message.Message();
                    msg.parseJSON(reply[i]);
                    self.rss_format(res, msg);
                }
                self.rss_footer(res);
                res.end();
            });
        });

        // watch for quit request
        var client_monitor = redis.createClient(this.config.redis.port, this.config.redis.host);
        client_monitor.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            if (msg.command == message.QUIT) { 
                self.end();
            }
        });
        client_monitor.subscribe(this.config.redis_keys.channel);

        // end
        self.end = function() {
            client_monitor.unsubscribe();
            client_monitor.quit();
            client_monitor.end();

            client.quit();
            client.end();

            server.close();
        };

        server.listen(this.config.http_server_rss.port, this.config.http_server_rss.host);
        console.log('RSS Server running at http://' + this.config.http_server_rss.host + ':' + this.config.http_server_rss.port + '/');
    }
};

exports.historian = {
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    save_to_history: function(client, msg) {
        var self = this;

        function check_max_length(err, reply) {
            if (parseInt(reply, 10) > self.config.history_max_count) {
                // trim, too long
	            client.ltrim(self.config.redis_keys.history_key, 0, self.config.redis_keys.history_max_count - 1);
            }
        }

        // if this key does not exist then create it
        client.lpush(this.config.redis_keys.history_key, msg, check_max_length);
    },

    run: function() {
        var redis = require('redis');
        var listener = redis.createClient(this.config.redis.port, this.config.redis.host);
        var history = redis.createClient(this.config.redis.port, this.config.redis.host);

        self = this;
        listener.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            if ( msg.command != message.QUIT ) {
                console.log('historian saving: ' + msg._raw);
                self.save_to_history(history, msg.raw);
            }
            if ( msg.command == message.QUIT ) {
                self.end();
            }
        });

        self.end = function() {
            listener.unsubscribe();
            listener.quit();
            listener.end();
            
            history.quit();
            history.end();
        };

        listener.subscribe(this.config.redis_keys.channel);
        console.log('historian is listening to: ' + this.config.redis_keys.channel);
    }
};

exports.purge = {
    config: null,

    // start/end calls
    start: function() { },
    end: function() { },

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);
        var self = this;

        client.on('connect', function() {
            client.del(self.config.redis_keys.channel);
            client.del(self.config.redis_keys.history_key);
            client.del(self.config.redis_keys.history_duration);
            client.del(self.config.redis_keys.history_max_count);
            client.quit();
            client.end();
        });

        console.log('Purged RSS-Collector keys');
    }
};

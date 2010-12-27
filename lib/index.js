/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var redis = require('redis'),
    util = require('util'),
    message = require('./message'),
    pp = require('./util').pp;

require('./date');

var base = {
    config: null,
    end: function() { },
    run: function() { },
    help: function() {
        return 'Need to add help for this item';
    },

    /*
    * @param {Object} config object containing ['port', 'host']
    * @return {redis.createClient}
    */
    createRedis: function(config) {
        if ( config === undefined ) {
            return redis.createClient(this.config.redis.port, this.config.redis.host);
        } else {
            return redis.createClient(config.port, config.host);
        }
    },

    /*
    * Will terminate the connection
    * @param {redis.createClient} client
    * @param {Function} callback executes this code when msg.command == message.QUIT comes down the pipe line
    * @return {redis.createClient}
    */
    watchForQuit: function(client, callback) {
    }
};

/**
* Dump redis history and info to console
*/
function Dump() {
    var self = this;
    self.help = function() {
        return '\'dump\' will dump the contents of redis to the console';
    };
    
    self.run = function() {
        var client = this.createRedis();

        self.end = function() {
            client.quit();
            client.end();
        };

        client.llen(this.config.redis_keys.history_key, function(err, reply) {
            console.log('We are listening to redis server: redis://' + self.config.redis.host + ':' + self.config.redis.port);
            console.log('The redis channel we are listening to is: ' + self.config.redis_keys.channel);
            var count = parseInt(reply, 10);
            console.log('There are ' + count + ' items stored in the history; history_key = ' + self.config.redis_keys.history_key);

            client.lrange(self.config.redis_keys.history_key, 0, -1, function(err, reply) {
                pp(reply);
                for (var i = 0; i < reply.length; i += 1) {
                    console.log(reply[i]);
                }
                self.end();
            });
        });
    };
}
Dump.prototype = base;
exports.Dump = Dump;

/**
* Send a quick message out via redis
*/
function Say() {
    var self = this;
    self.help = '\'say "message"\' will send the contents of a message to RSS-Collector via redis pub-sub';
    
    self.run = function() {
        var client = self.createRedis();

        var mesg = new message.Message({
            command: message.DATA,
            category: 'command line',
            data: Array.prototype.slice.call(arguments).join(' ')
        });

        client.on('connect', function() {
            var json = mesg.toJSON();
            console.log('Sending 1 messages to channel: ' + self.config.redis_keys.channel + ' message: ' + json);
            client.publish(self.config.redis_keys.channel, json);
            client.quit();
            client.end();
        });
    };
}
Say.prototype = base;
exports.Say = Say;

/**
* Accept POST/GET requests and insert into the redis pub-sub model
*/
function AcceptHTTPInput() {
    var self = this;
    self.help = function() {
        return '\'accept_http_input\' will start an http service at http://' + this.config.http_server_input.host + ':' + this.config.http_server_input.port + '/' + " which will accept GET messages\n";
    };

    self.running = false;

    self.run = function() {
        var http = require('http'),
            url = require('url'),
            client = self.createRedis();

        self.running = false;

        // server actions
        var server = http.createServer();
        server.on('request', function (req, res) {
            if ( req.method === 'GET' ) {
                // get the query parts and assign them to msg
                var parts = url.parse(req.url, true);
                var msg = new message.Message();
                msg.bulk_assign(parts.query);

                // save message
                client.publish(self.config.redis_keys.channel, msg.toJSON());

                // signify that we have recieved the content.
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('GET Received.\n');

                if ( msg.command === message.QUIT ) {
                    self.end();
                }
            } else if ( req.method === 'POST' ) {
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
            if ( msg.command === message.QUIT ) {
                self.end();
            }
        });

        // this is how we close
        self.end = function() {
            if ( self.running ) {
                self.running = false;
                client.quit();
                client.end();
                client_monitor.quit();
                client_monitor.end();
                server.close();
            }
        };

        server.listen(this.config.http_server_input.port, this.config.http_server_input.host);
        console.log('HTTP Input Server running at http://' + this.config.http_server_input.host + ':' + this.config.http_server_input.port + '/');
        this.running = true;
    };
}
AcceptHTTPInput.prototype = base;

exports.AcceptHTTPInput = AcceptHTTPInput;

/*
* listener does nothing but listen to the pub-sub in redis and display the message to console
* This is useful for debugging
*/
function Listener() {
    var self = this;
    
    self.help = function() {
        return "\'listener\' will monitor the redis channel and display messages.\n";
    };
    
    self.run = function() {
        var client = self.createRedis();

        client.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            console.log('listener recieved: ' + msg._raw );
            if ( msg.command === message.QUIT ) {
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
    };
}
Listener.prototype = base;

exports.Listener = Listener;

/*
* RSSServer displays the history as an rss feed
*/
function RSSServer() {
    var self = this;
    
    self.help = function() {
        return '\'rss_server\' will start an http rss service at http://' + this.config.http_server_rss.host + ':' + this.config.http_server_rss.port + '/' + "\n";
    };
    
    /* rss_header produces the rss header
     * @param {http.ServerResponse} res
     * @param {Date} date
     */
    self.rss_header = function(res, date) {
        if ( date === undefined ) {
            date = new Date();
        }

        res.write('<?xml version="1.0" encoding="UTF-8" ?>' + "\n");
        res.write('<rss version="2.0">' + "\n");
        res.write('<channel>' + "\n");
        res.write('<title>' + this.config.rss.title + '</title>' + "\n");
        // res.write('<description>This is an example of an RSS feed</description>' + "\n");
        res.write('<link>https://github.com/danlo</link>' + "\n");
        res.write('<lastBuildDate>' + date.rfc822date() + '</lastBuildDate>' + "\n");
        res.write('<pubDate>' + date.rfc822date() + '</pubDate>' + "\n");
    };

    /* rss_header produces the rss footer
     * @param {http.ServerResponse} res
     */
    self.rss_footer = function(res) {
        res.write('</channel>' + "\n");
        res.write('</rss>' + "\n");
    };

    /* rss_header produces the rss footer
     * @param {http.ServerResponse} res
     * @param {Message} msg
     */
    self.rss_format = function(res, msg) {
        res.write('<item>' + "\n");
        res.write('<title>' + msg.category + ' / ' + msg.command + '</title>' + "\n");
        res.write('<description>' + msg.data + '</description>' + "\n");
        // res.write('<link>N/A</link>' + "\n");
        res.write('<guid>' + msg.guid + '</guid>' + "\n");
        res.write('<pubDate>' + msg.eventDate.rfc822date() + '</pubDate>' + "\n");
        res.write('</item>' + "\n");
    };

    self.run = function() {
        var client = self.createRedis();

        var http = require('http');
        var server = http.createServer(function (req, res) {
            client.lrange(self.config.redis_keys.history_key, 0, -1, function(err, reply) {
                res.writeHead(200, {'Content-Type': 'application/rss+xml'});
                self.rss_header(res);
                for (var i = 0; i < reply.length; i+=1) {
                    var msg = new message.Message();
                    msg.parseJSON(reply[i]);
                    self.rss_format(res, msg);
                }
                self.rss_footer(res);
                res.end();
            });
        });

        // watch for quit request
        var client_monitor = self.createRedis();
        client_monitor.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            if (msg.command === message.QUIT) {
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
    };
}
RSSServer.prototype = base;

exports.RSSServer = RSSServer;

/*
* historian listens to the pub-sub channel and stores it into the history
*/
function Historian() {
    var self = this;
    
    self.help = function() {
        return "'historian' will record all messages on the redis channel: " + this.config.redis_keys.channel + ' start an http rss service at http://' + this.config.http_server_rss.host + ':' + this.config.http_server_rss.port + "/\n";
    };

    self.save_to_history = function(client, msg) {
        client.lpush(this.config.redis_keys.history_key, msg, function(err, reply) {
            if (parseInt(reply, 10) > self.config.history_max_count) {
                // trim, key is too long
	            client.ltrim(self.config.redis_keys.history_key, 0, self.config.redis_keys.history_max_count - 1);
            }
        });
    };

    self.run = function() {
        var listener = self.createRedis(),
            history = self.createRedis();

        listener.on('message', function(channel, new_message) {
            var msg = new message.Message();
            msg.parseJSON(new_message);
            if ( msg.command !== message.QUIT ) {
                console.log('historian saving: ' + msg._raw);
                self.save_to_history(history, msg._raw);
            }
            if ( msg.command === message.QUIT ) {
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
    };
}
Historian.prototype = base;

exports.Historian = Historian;

/*
* Purge will remove all RSS-Collector information
*/
function Purge() {
    var self = this;
    
    self.help = function() {
        return "'purge' will remove all currently stored redis_keys associated with RSS-Collector\n";
    };
    
    self.run = function() {
        var client = self.createRedis();

        client.on('connect', function() {
            client.del(self.config.redis_keys.channel);
            client.del(self.config.redis_keys.history_key);
            client.del(self.config.redis_keys.history_duration);
            client.del(self.config.redis_keys.history_max_count);
            client.quit();
            client.end();
            console.log('Purged RSS-Collector keys');
        });
    };
}
Purge.prototype = base;
exports.Purge = Purge;

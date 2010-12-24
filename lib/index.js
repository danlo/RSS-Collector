var redis = require('redis');
var util = require('util');
var message = require('./message');
var pp = require('./util').pp;

/**
* Send several messages out via redis
*/
exports.dump = { 
    config: null,

    run: function() {
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);
        
        var self = this;
        client.llen(this.config.history_key, function(err, reply) {
            console.log('We are listening to redis server: ' + self.config.redis.port + ':' + self.config.redis.host);
            console.log('The redis channel we are listening to is: ' + self.config.channel);
            count = parseInt(reply, 10);
            console.log('There are ' + count + ' items stored in the history; history_key = ' + self.config.history_key);
            
            client.lrange(self.config.history_key, 0, -1, function(err, reply) {
                for (var i = 0; i < reply.length; i++) {
                    console.log(reply[i]);
                }
                client.quit();
                client.end();
            });
        });
    }
};

/**
* Send a quick message out via redis
*/
exports.say = { 
    config: null,

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);

        var msg = Array.prototype.slice.call(arguments).join(' ');
        var self = this;
        client.on('connect', function() {
            var mesg = new message.Message();
            mesg.data = msg;
            mesg.category = 'command line';
            var json = mesg.toJSON();
            console.log('Sending 1 messages to channel: ' + self.config.channel + ' message: ' + json);
            client.publish(self.config.channel, json);
            client.quit();
            client.end();
        });
    }
};

/* 
 * listener does nothing but listen to the pub-sub in redis and display the message to console
 * This is useful for debugging
 */
exports.listener = { 
    config: null,

    parse_msg: function(msg) {
        obj = JSON.parse(msg);
        obj.raw = msg;
        
        return obj;
    },
    
    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config.redis.port, this.config.redis.host);

        var self = this;
        client.on('message', function(channel, message) {
            msg = self.parse_msg(message);
            console.log('listener recieved: ' + msg.raw );
            if (msg.cmd == 'quit') { 
                client.unsubscribe();
                client.quit();
                client.end();
            }
        });

        client.subscribe(this.config.channel);
        console.log('Listening to: ' + this.config.channel);
    }
};

/*
 * historian listens to the pub-sub channel and stores it into the history
 */
exports.historian = {
    config: null,

    parse_msg: function(msg) {
        obj = JSON.parse(msg);
        obj.raw = msg;
        
        return obj;
    },
    
    save_to_history: function(client, msg) {
        var self = this;

        function check_max_length(err, reply) {
            if (parseInt(reply, 10) > self.config.history_max_count) {
                // trim, too long
	            client.ltrim(self.config.history_key, 0, self.config.history_max_count - 1);
            }
        }

        // if this key does not exist then create it
        client.lpush(this.config.history_key, msg, check_max_length);
    },
    
    rss_header: function(res, date) {
        res.write('<?xml version="1.0" encoding="UTF-8" ?>' + "\n");
        res.write('<rss version="2.0">' + "\n");
        res.write('<channel>' + "\n");
        res.write('<title>Message Aggeratator</title>' + "\n");
        // res.write('<description>This is an example of an RSS feed</description>' + "\n");
        res.write('<link>https://github.com/danlo</link>' + "\n");
        res.write('<lastBuildDate>' + date.rfc822date() + '</lastBuildDate>' + "\n");
        res.write('<pubDate>' + date.rfc822date() + '</pubDate>' + "\n");
    },

    rss_footer: function(res) {
        res.write('</channel>' + "\n");
        res.write('</rss>' + "\n");
    },

    rss_format: function(res, msg) {
        res.write('<item>' + "\n");
        res.write('<title>' + msg.category + ' / ' + msg.command + '</title>' + "\n");
        res.write('<description>' + msg.data + '</description>' + "\n");
        // res.write('<link>N/A</link>' + "\n");
        res.write('<guid>' + msg.guid + '</guid>' + "\n");
        res.write('<pubDate>' + msg.eventDate.rfc822date() + '</pubDate>' + "\n");
        res.write('</item>' + "\n");
    },

    view_history: function() {
        var redis = require('redis'),
            client = redis.createClient(this.config.redis.port, this.config.redis.host);            
        var http = require('http');
        
        var self = this;
        http.createServer(function (req, res) {
            client.lrange(self.config.history_key, 0, -1, function(err, reply) {
                res.writeHead(200, {'Content-Type': 'application/rss+xml'});
                var date = new Date();
                self.rss_header(res, date);
                for (var i = 0; i < reply.length; i++) {
                    var msg = new message.Message();
                    msg.parseJSON(reply[i]);
                    self.rss_format(res, msg);
                }
                self.rss_footer(res);
                res.end();
            });
        }).listen(8124, "127.0.0.1");
        
        console.log('Server running at http://127.0.0.1:8124/');
    },
    
    save_history: function() {
        var redis = require('redis');
        var listener = redis.createClient(this.config.redis.port, this.config.redis.host),
            history = redis.createClient(this.config.redis.port, this.config.redis.host);
    
        self = this;
        listener.on('message', function(channel, message) {
            msg = self.parse_msg(message);
            if ( msg.command != 'quit' ) {
                console.log('asking historian to save message: ' + msg.raw);
                self.save_to_history(history, msg.raw);
            }
        });
    
        listener.subscribe(this.config.channel);
        console.log('historian is listening to: ' + this.config.channel);
    },
    
    run: function() {
        this.save_history();
        this.view_history();
    }
};

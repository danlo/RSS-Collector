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
                console.log('triming ' + self.config.history_key + ' to ' + self.config.history_max_count + ' entries');
	            client.ltrim(self.config.history_key, 0, self.config.history_max_count - 1);
            } else {
                console.log('There are ' + reply + ' messages in the history');
            }

            client.lrange(self.config.history_key, 0, -1, function(err, reply) {
                console.log('Current messages: ' + reply);
            });
        }

        // if this key does not exist then create it
        client.lpush(this.config.history_key, msg, check_max_length);
    },
    
    rss_header: function(date) {
        var string = '';

        string = '';
        string +=  string += '<?xml version="1.0" encoding="UTF-8" ?>' + "\n";
        string += '<rss version="2.0">' + "\n";
        string += '<channel>' + "\n";
        string += '<title>Message Aggeratator</title>' + "\n";
//        string += '<description>This is an example of an RSS feed</description>' + "\n";
        string += '<link>https://github.com/danlo</link>' + "\n";
        string += '<lastBuildDate>' + date.rfc822date() + '</lastBuildDate>' + "\n";
        string += '<pubDate>' + date.rfc822date() + '</pubDate>' + "\n";
        
        return string;
    },

    rss_footer: function(res) {
        var string = '';

        string += '</channel>' + "\n";
        string += '</rss>' + "\n";

        return string;
    },

    rss_format: function(msg) {
        var string = '';
        string += '<item>' + "\n";
        // string += '<title>Messages</title>' + "\n";
        string += '<description>' + msg.data + '</description>' + "\n";
        // string += '<link>N/A</link>' + "\n";
        // string += '<guid>unique string per item</guid>' + "\n";
        // string += '<pubDate>Mon, 06 Sep 2009 16:45:00 +0000 </pubDate>' + "\n";
        string += '</item>' + "\n";

        return string;
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
                res.write(self.rss_header(date));
                for (var i = 0; i < reply.length; i++) {
                    var msg = new message.Message();
                    msg.parseJSON(reply[i]);
                    res.write(self.rss_format(msg));
                }
                res.write(self.rss_footer());
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
    
    back_door: function() {
        // https://github.com/joyent/node-camp/blob/master/hexes/server.js
        var repl = require('repl');
        var net = require('net');
        net.createServer(function (connection) {
            connection.write("Welcome to the backdoor\n");
            repl.start("historian server> ", connection);
        }).listen(9000);
    },
    
    run: function() {
        this.save_history();
        this.view_history();
        this.back_door();
    }
};

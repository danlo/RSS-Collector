var redis = require('redis');
var util = require('util');
require('./message');


// I don't like modifying global prototypes.. but I'll make an exception in this case
Date.prototype.rfc822date = function() {
    var weekday_name = { 0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6: 'Sat' };
    var month_name = { 0:'Jan', 1:'Feb', 2:'Mar', 3:'Apr', 4:'May', 5:'Jun', 6: 'Jul', 7:'Aug', 8:'Sep', 9:'Oct', 10:'Nov', 11:'Dec' };

    var zeropad = function(num, length) {
        if ( length == null ) length = 2;

        add = length - num.toString().length;
        zeros = new String();
        for (var i = 0; i < add; i++ ) zeros = zeros + '0';
        return zeros + num;
    };
    
    return weekday_name[this.getUTCDay()] + ', ' +
    this.getUTCDate() + ' ' +
    month_name[this.getUTCMonth()] + ' ' +
    this.getUTCFullYear() + ' ' +
    zeropad(this.getUTCHours()) + ':' +
    zeropad(this.getUTCMinutes()) + ':' +
    zeropad(this.getUTCSeconds()) + ' UTC';
};

/**
* Send several messages out via redis
*/
exports.speaker = { 
    config: null,

    run: function() {
        var client = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);

        var self = this
        client.on('connect', function() {
            console.log('Sending 4 messages to: ' + self.config.channel);
            for ( var i=0; i< 5; i += 1 ) {
                var list = { index: i };
                client.publish(self.config.channel, self.make_msg('msg', list));
            }
            client.publish(self.config.channel, self.make_msg('quit'));
            client.quit();
            client.end();
        });
    },
};

/**
* Send a quick message out via redis
*/
exports.spit = { 
    config: null,

    make_msg: function(command, data) {
        return JSON.stringify({ "command": command, "data": data })
    },

    run: function() {
        var date = new Date()
        var msg = date.toString() + ': ' + Array.prototype.slice.call(arguments).join(' ')
        var redis = require('redis');
        var client = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);

        var self = this
        client.on('connect', function() {
            console.log('Sending 1 messages to: ' + self.config.channel + ' message: ' + msg);
            client.publish(self.config.channel, self.make_msg('msg', msg));
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
        obj.raw = msg
        
        return obj;
    },
    
    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);

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
        obj.raw = msg
        
        return obj;
    },
    
    save_to_history: function(client, msg) {
        var self = this
        
        // if this key does not exist then create it
        client.lpush(this.config['history_key'], msg, check_max_length)
        function check_max_length(err, reply) {
            if (parseInt(reply) > self.config['history_max_count']) {
                console.log('triming ' + self.config['history_key'] + ' to ' + self.config['history_max_count'] + ' entries')
	            client.ltrim(self.config['history_key'], 0, self.config['history_max_count'] - 1)
            } else {
                console.log('There are ' + reply + ' messages in the history')
            }

            client.lrange(self.config['history_key'], 0, -1, function(err, reply) {
                console.log('Current messages: ' + reply)
            });
        }
    },
    
    rss_header: function(res, date) {
        res.write('<?xml version="1.0" encoding="UTF-8" ?>' + "\n");
        res.write('<rss version="2.0">' + "\n");
        res.write('<channel>' + "\n");
        res.write('<title>RSS Title</title>' + "\n");
        res.write('<description>This is an example of an RSS feed</description>' + "\n");
        res.write('<link>https://github.com/danlo</link>' + "\n");
        res.write('<lastBuildDate>' + date.rfc822date() + '</lastBuildDate>' + "\n");
        res.write('<pubDate>' + date.rfc822date() + '</pubDate>' + "\n");
    },
    
    rss_footer: function(res) {
        res.write('</channel>' + "\n");
        res.write('</rss>' + "\n");
    },
    
    rss_format: function(res, msg) {
        util.debug(util.inspect(msg));
        res.write('<item>' + "\n");
        // res.write('<title>Example entry</title>' + "\n");
        res.write('<description>' + msg.data + '</description>' + "\n");
        // res.write('<link>N/A</link>' + "\n");
        // res.write('<guid>unique string per item</guid>' + "\n");
        // res.write('<pubDate>Mon, 06 Sep 2009 16:45:00 +0000 </pubDate>' + "\n");
        res.write('</item>' + "\n");
    },
    
    view_history: function() {
        var redis = require('redis')
            client = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);            
        var http = require('http');
        
        var self = this;
        http.createServer(function (req, res) {
            client.lrange(self.config['history_key'], 0, -1, function(err, reply) {
                res.writeHead(200, {'Content-Type': 'application/rss+xml'})
                var date = new Date();
                self.rss_header(res, date);
                for (var i = 0; i < reply.length; i++) {
                    var message = new Message();
                    message.parseJSON(reply[i]);
                    self.rss_format(res, message);
                }
                self.rss_footer(res);
                res.end()              
            })
        }).listen(8124, "127.0.0.1")
        
        console.log('Server running at http://127.0.0.1:8124/');
    },
    
    save_history: function() {
        var redis = require('redis');
        var listener = redis.createClient(this.config['redis']['port'], this.config['redis']['host']),
            history = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);
    
        self = this;
        listener.on('message', function(channel, message) {
            msg = self.parse_msg(message);
            if ( msg.command != 'quit' ) {
                console.log('asking historian to save message: ' + msg.raw);
                self.save_to_history(history, msg.raw)
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
    },
};

var redis = require('redis');

function StatsCollector(options) {
    // force new
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments)
    }

    var self = this;

    self.init()
};

// make sure that we've added it
// module.exports = StatsCollector;

// main body of code
StatsCollector.prototype.init = function() {
}

StatsCollector.prototype.create_msg = function(command, category, automated, obj) {
    msg = { 'command': command, 'data': obj, 'automated' : automated, 'category' : category }

    return JSON.stringify(msg)
}

StatsCollector.prototype.parse_msg = function(msg) {
    obj = JSON.parse(msg);
    // for compactness store the raw message in obj for future usage.
    obj.raw = msg

    return obj
}

StatsCollector.proto
exports.speaker = { 
    config: null,

    make_msg: function(command, obj) {
        msg = { "command": command, "data": obj };
        return JSON.stringify(msg);
    },

    run: function() {
        var redis = require('redis');
        var client = redis.createClient(this.config['redis']['port'], this.config['redis']['host']);

        var me = this
        client.on('connect', function() {
            console.log('Sending 4 messages to: ' + me.config.channel);
            for ( var i=0; i< 5; i += 1 ) {
                var list = { index: i };
                client.publish(me.config.channel, me.make_msg('msg', list));
            }
            client.publish(me.config.channel, me.make_msg('quit'));
            client.quit();
            client.end();
        });
    },
    
};

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

        var me = this
        client.on('connect', function() {
            console.log('Sending 1 messages to: ' + me.config.channel + ' message: ' + msg);
            client.publish(me.config.channel, me.make_msg('msg', msg));
            client.quit();
            client.end();
        });
    },
    
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

        var me = this;
        client.on('message', function(channel, message) {
            msg = me.parse_msg(message);
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
 * historian listens to the pub-sub channel and stores it into the configuration
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
    
    view_history: function() {
        var redis = require('redis')
            client = redis.createClient(this.config['redis']['port'], this.config['redis']['host'])
            
        var http = require('http')
        
        var self = this
        http.createServer(function (req, res) {
            client.lrange(self.config['history_key'], 0, -1, function(err, reply) {
                res.writeHead(200, {'Content-Type': 'text/plain'})
                console.log('serving reply: ' + reply.length)
                for (var i = 0; i < reply.length; i++) {
                    msg = self.parse_msg(reply[i])
                    res.write(msg.data + "\n")
                }
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
        this.save_history()
        this.view_history()
        this.back_door()
    },
};

/**
* @author wilburlo@gmail.com Daniel Lo
* @license MIT License. See LICENSE.txt
*/
/*jslint devel: true, undef: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global __dirname, require, setTimeout, clearTimeout */
"use strict";

var message = require('lib/message.js'),
    redis = require('redis'),
    util = require('util'),
    pp = require('lib/util.js').pp,
    fs = require('fs'),
    config = require(__dirname + '/../lib/config.js').load(__dirname + '/../config.yaml');

function create_message(obj) {
    var msg = new message.Message({ command: message.NOOP,
        data: 'WOOT',
        automated: false,
        category: 'test',
        eventDate: new Date(100)
    });

    if ( typeof obj === 'object' ) {
        msg.bulk_assign(obj);
    } else if ( typeof obj === 'string' ) {
        msg.parseJSON(obj);
    }

    return msg;
}

exports.factory = function(test) {
    test.expect(2);
    var msg = create_message({ category: 'test1'});
    test.equal(msg.category, 'test1', 'factory test');
    
    var msg2 = new message.Message('{"command":"DEEP"}');
    test.equal(msg2.command, 'DEEP');
    test.done();
};

exports.convert_property = function(test) {
    var msg = create_message({ eventDate: '2010-12-24T09:15:47.157Z' });
    test.ok(msg.eventDate instanceof Date);

    test.done();
};

exports.data = function(test) {
    var msg = create_message();

    // test is_message_data()
    test.ok(msg.is_message_data('command'), "command test");
    test.ok(! msg.is_message_data('_raw'));

    test.done();
};

exports.json = function(test) {
    var msg = create_message({ command:'DATA', data:'boo-woo', guid: 44301336398348 });
    var valid = '{"command":"DATA","data":"boo-woo","automated":false,"category":"test","guid":44301336398348,"eventDate":"1970-01-01T00:00:00.100Z"}';

    test.equal(msg.toJSON(), valid, 'comparing json strings');

    var msg2 = new message.Message();
    msg2.parseJSON(msg.toJSON());
    
    var list = [ 'data', 'category', 'automated' ];
    list.forEach(function(i) {
        test.equal(msg2[i], msg[i], 'comparing ' + i);
    });

    test.done();
};

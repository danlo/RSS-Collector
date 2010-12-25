/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

var message = require('lib/message.js');
var util = require('util');
var pp = require('lib/util.js').pp;

function create_message(obj) {
    var msg = new message.Message();
    msg.command = 'NOOP';
    msg.data = 'WOOT';
    msg.automated = false;
    msg.category = 'test';
    msg.eventDate = new Date(100);

    if ( obj ) {
        for ( var i in obj ) {
            if ( obj.hasOwnProperty(i) ) {
                msg[i] = obj[i];
            }
        }
    }

    return msg;
}

exports.factory = function(test) {
    var msg = create_message({ test: 'test'});
    
    // test is_message_data()
    test.equal(msg.test, 'test', 'factory test');

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
    var msg = create_message({ command:'DATA', 'data':'boo-woo'});
    var valid = '{"command":"DATA","data":"boo-woo","automated":false,"category":"test","eventDate":"1970-01-01T00:00:00.100Z"}';

    test.equal(msg.toJSON(), valid, 'comparing json strings');

    var msg2 = new message.Message();
    msg2.parseJSON(msg.toJSON());
    
    var list = Array('data', 'category', 'automated');
    list.forEach(function(i) {
        test.equal(msg2[i], msg[i], 'comparing ' + i);
    });

    test.done();
};

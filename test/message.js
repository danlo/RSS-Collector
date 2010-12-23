var message = require('lib/message.js');
var util = require('util');

function create_message() {
    var msg = new Message();
    msg.command = 'NOOP';
    msg.data = 'WOOT';
    msg.automated = false;
    msg.category = 'test';
    
    return msg;
}

exports.Message_data = function(test) {
    msg = create_message();

    // test is_message_data()
    test.ok(msg.is_message_data('command'), "command test");
    test.ok(! msg.is_message_data('_raw'));
    test_func = function() { };
    test.ok(! msg.is_message_data(test_func));

    test.done();
};

exports.Message_json = function(test) {
    msg = create_message();
    
    valid = '{"command":"NOOP","data":"WOOT","category":"test"}';

    test.equal(msg.toJSON(), valid);

    msg2 = new Message();
    msg2.parseJSON(valid);

    test.deepEqual(msg2, msg); 

    test.done();  
};
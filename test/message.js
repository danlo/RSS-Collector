var message = require('lib/message.js');
var util = require('util');

function create_message(obj) {
    var msg = new Message();
    msg.command = 'NOOP';
    msg.data = 'WOOT';
    msg.automated = false;
    msg.category = 'test';
    
    if ( ! obj ) 
        for ( var i in obj ) 
            msg[i] = obj[i];
    
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

exports.Message_equal = function(test) {
    msg1 = create_message();
    msg2 = create_message();
    msg3 = create_message({ data: 'BOOT' });

    test.ok(msg1.equal(msg2), 'Comparing msg1 against msg2');
    test.ok(msg1.equal(msg3), 'Comparing msg1 against msg3');

    test.done();
};

exports.Message_json = function(test) {
    msg = create_message();
    
    valid = '{"command":"NOOP","data":"WOOT","category":"test"}';
    test.equal(msg.toJSON(), valid, 'comparing json strings');

    msg2 = new Message();
    msg2.parseJSON(valid);
    test.ok(msg.equal(msg2), 'comparing msg against msg2'); 

    test.done();
};

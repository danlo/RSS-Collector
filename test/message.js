var message = require('lib/message.js');
var util = require('util');

pp = function(item, string) {
    var util = require('util');

    if ( string ) {
        util.debug(string + ' ' + util.inspect(item));
    } else {
        util.debug(util.inspect(item));
    }
};

function create_message(obj) {
    var msg = new message.Message();
    msg.command = 'NOOP';
    msg.data = 'WOOT';
    msg.automated = false;
    msg.category = 'test';

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
    test_func = function() { };
    test.ok(! msg.is_message_data(test_func));

    test.done();
};

exports.json = function(test) {
    var msg = create_message({ command:'DATA', 'data':'boo-woo'});
    var valid = '{"command":"DATA","data":"boo-woo","category":"test"}';
    
    test.equal(msg.toJSON(), valid, 'comparing json strings');

    var msg2 = new message.Message();
    msg2.parseJSON(msg.toJSON());
    test.ok(msg.equal(msg2), 'comparing msg against msg.toJSON'); 

    test.done();
};

exports.equal = function(test) {
    var msg1 = create_message(),
        msg2 = create_message(),
        msg3 = create_message({ data: 'BOOT' });

    test.ok(msg1.equal(msg2), 'Comparing msg1 against msg2');
    test.ok(! msg1.equal(msg3), 'Comparing msg1 against msg3');

    test.done();
};

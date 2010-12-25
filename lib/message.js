/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

/*
Message structure

command -> Internal method to communicate with the stats collector and associated listeners
  QUIT -> ask everything to quit
  FLUSH -> purge the history, purge the lists
  DATA -> a block of data
  NOOP -> empty
  PING -> data may contain some time stamp information, but just ping

data -> a block of data, again JSON formatted

automated -> indicates that this is a machine produced message, a possible filter

category -> the name of the category this message belongs to
*/

exports.Message = function(obj) {
    // force new
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments);
    }
    var self = this;

    // properties begining with '_' are assumed to be private and not to be exported
    self._raw = '';

    // convert these to dates
    self._dateProperties = [ 'eventDate' ]; 

    // all others will be exported by default, modify is_message_data() to change 
    // what is to be exported
    self.command = 'NOOP';
    self.data = '';
    self.automated = false;
    self.category = '';
    self.guid = Math.floor(Math.random()*1000000000000000);
    self.eventDate = new Date();

    self.convert_property = function(name, value) {
        // Array.indexOf returns -1 for missing, 0 is returned for item 0 upon match and is false.
        // is this a date object?
        var ret = value;
        if ( self._dateProperties.indexOf(name) != -1 && ! (value instanceof Date) ) {
            if ( typeof value == 'string' && value.match(/^\d{4}\-\d{2}\-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/) ) {
                ret = new Date(value);
            } else if ( value instanceof Date ) {
                ret = value;
            } else if ( ! value instanceof Date ) {
                throw "unknown date format expect(YYYY-MM-DDTHH:MM:SS.MSZ): " + value.toString();
            }
        }

        return ret;
    };
    
    /**
    * Returns true if the property is "private" and is not to be exported in a message
    * @param {String} prop The property in question
    * @return {Boolean}
    */
    self.is_message_data = function(prop) {
        var result = ( typeof self[prop] == 'string' || typeof self[prop] == 'number' || typeof self[prop] == 'boolean' || self[prop] instanceof Date ) && prop.charAt(0) != '_';
        // console.log('testing property: ' + prop);
        // console.log('is_message_data(' + prop + ') = typeof self[prop] = ' + typeof self[prop] + ' firstChar = ' + prop.charAt(0) + ' result = ' + result);
        return result;
    };
    
    /**
    * bulk_assign a message
    * @param {Object} obj the object to include properties from
    * @return {this}
    */
    self.bulk_assign = function(obj) {
        // copy all properties that belong to Message only
        for ( var i in obj ) {
            if ( obj.hasOwnProperty(i) && self.is_message_data(i) ) {
                self[i] = self.convert_property(i, obj[i]);
            }
        }

        return self;
    };
    
    /**
    * Parses an existing message
    * @param {String} msg the message to be parsed MUST be JSON formated
    * @return {Message}
    */
    self.parseJSON = function(msg) {
        var obj = JSON.parse(msg);

        self.bulk_assign(obj);
        self._raw = msg;
        
        return self;
    };

    /**
    * extract_message_data
    * @return {Object} an basic object containing message data
    */
    self.extract_message_data = function() {
        var message = { };

        // copy all properties
        for ( var i in self ) {
            if ( self.is_message_data(i) ) {
                message[i] = self[i];
            }
        }

        return message;
    };

    /**
    * pack this object into JSON format
    * @return {String} JSON encoded message
    */
    self.toJSON = function(trust) {
        return JSON.stringify(self.extract_message_data());
    };
}; // close for Message

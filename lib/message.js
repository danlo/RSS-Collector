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

    // all others will be exported by default, modify is_message_data() to change 
    // what is to be exported
    self.command = 'NOOP';
    self.data = '';
    self.automated = false;
    self.category = '';
    self.eventDate = new Date();
    
    /**
    * Returns true if the property is "private" and is not to be exported in a message
    * @param {String} prop The property in question
    * @return {Boolean}
    */
    self.is_message_data = function(prop) {
        // console.log('testing property: ' + prop);
        var result = ( typeof self[prop] == 'string' || typeof self[prop] == 'boolean' || self[prop] instanceof Date ) && prop.charAt(0) != '_';
        // console.log('is_message_data(' + prop + ') = typeof self[prop] = ' + typeof self[prop] + ' firstChar = ' + prop.charAt(0) + ' result = ' + result);
        return result
    };
    
    /**
    * Parses an existing message
    * @param {String} msg the message to be parsed MUST be JSON formated
    * @return {Message}
    */
    self.parseJSON = function(msg) {
        var obj = JSON.parse(msg);

        // copy all properties that belong to Message only
        for ( var i in obj ) {
            if ( obj.hasOwnProperty(i) && self.is_message_data(i) ) {
                self[i] = obj[i];
            }
            if ( i == 'eventDate' ) {
                self[i] = new Date(self[i]);
            }
        }

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

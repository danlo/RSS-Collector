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

Message = function(obj) {
    // force new
    if (! (this instanceof arguments.callee)) {
        return new arguments.callee(arguments)
    }
    self = this;

    // properties begining with '_' are assumed to be private and not to be exported
    self._raw = '';

    // all others will be exported by default, modify is_message_data() to change 
    // what is to be exported
    self.command = 'NOOP';
    self.data = '';
    self.automated = false;
    self.category = '';
    
    /**
    * Returns true if the property is "private" and is not to be exported in a message
    * @param {String} prop The property in question
    * @return {Boolean}
    */
    self.is_message_data = function(prop) {
        return typeof self[prop] == 'string' && prop.charAt(0) != '_';
    };
    
    self.equals = function (other) {
        if ( trust == null ) 
            // copy only known properties
            for ( var i in message ) {
                if ( data[i] !== null && self.is_message_data(i) ) {
                    self[i] = data[i];
                }
            }
        else {
            // copy all properties that belong to Message only
            for ( var i in obj ) {
                if ( obj.hasOwnProperty(i) && self.is_message_data(i) ) {
                    self[i] = data[i];
                }
            }
        }
    }

    /**
    * Parses an existing message
    * @param {String} msg the message to be parsed MUST be JSON formated
    * @param {Boolean} trust do we trust the message contents, or enforce our own standards
    * @return {Message}
    */
    self.parseJSON = function(msg, trust) {
        data = JSON.parse(msg);

        if ( trust == null ) 
            // copy only known properties
            for ( var i in message ) {
                if ( data[i] !== null && self.is_message_data(i) ) {
                    self[i] = data[i];
                }
            }
        else {
            // copy all properties that belong to Message only
            for ( var i in obj ) {
                if ( obj.hasOwnProperty(i) && self.is_message_data(i) ) {
                    self[i] = data[i];
                }
            }
        }

        self._raw = msg;

        return message;
    };

    self.extract_message_data = function(trust) {
        message = { }

        if ( trust == null ) 
            // copy all properties that belong to Message only
            for ( var i in self ) {
                if ( self.is_message_data(i) ) {
                    message[i] = self[i];
                }
            }
        else {
            // copy all properties
            for ( var i in self ) {
                message[i] = self[i];
            }
        }
        
        return message;
    };

    /**
    * pack this object into JSON format
    * @param {Boolean} trust use only properties known to Message
    * @return {String} JSON encoded message
    */
    self.toJSON = function(trust) {
        message = self.extract_message_data(trust);
        return JSON.stringify(message);
    };
} // close for Message

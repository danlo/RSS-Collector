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

exports.Message = {
    // properties begining with '_' are assumed to be private and not to be exported
    _raw: '',
    
    // all others will be exported by default, modify is_private() to change what is private or not
    command: 'NOOP',
    data: '',
    automated: false,
    category: '',

    /**
    * Returns true if the property is "private" and is not to be exported in a message
    * @param {String} prop The property in question
    * @return {Boolean}
    */
    is_private: function(prop) {
        return prop.charAt(0) == '_' ;
    },

    /**
    * Parses an existing message
    * @param {String} msg the message to be parsed MUST be JSON formated
    * @param {Boolean} trust do we trust the message contents, or enforce our own standards
    * @return {Message}
    */
    parse: function(msg, trust) {
        data = JSON.parse(msg);

        message = new Message();
    
        if ( trust == null ) 
            // copy only known properties
            for ( i in message ) {
                if ( data.i !== null && ! self.is_private(i) ) {
                    message.i = obj.i;
                }
            }
        else {
            // copy all properties that belong to Message only
            for ( i in obj ) {
                if ( obj.hasOwnProperty(i) && ! self.is_private(i) ) {
                    message.i = obj.i
                }
            }
        }

        message._raw = msg;

        return message;
    },

    /**
    * @param {Boolean} trust use only properties known to Message
    * @return {String} JSON encoded message
    */
    create_msg: function(trust) {
        data = JSON.parse(msg);

        message = new Message();
    
        if ( trust == null ) 
            // copy only known properties
            for ( i in message ) {
                if ( data.i !== null && ! self.is_private(i) ) {
                    message.i = obj.i;
                }
            }
        else {
            // copy all properties that belong to Message only
            for ( i in obj ) {
                if ( obj.hasOwnProperty(i) && ! self.is_private(i) ) {
                    message.i = obj.i
                }
            }
        }
        message._raw = msg;
        
        return message;
    }
    
} // close for Message

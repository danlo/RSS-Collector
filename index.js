// system libraries
var fs = require('fs');

// our own libraries
var APP_MODULES = require(__dirname + '/lib');

// load our configuration
try {
  var configJSON = fs.readFileSync(__dirname + '/config.json');
  config = JSON.parse(configJSON.toString());
} catch(e) {
  console.log("File /config.json not loadable");
}

// lets start the modules we need to start
if ( process.argv[2] in APP_MODULES ) {
    console.log('Running module:' + process.argv[2])
    console.log('Arguments:' + process.argv.slice(3))
    var APP = APP_MODULES[process.argv[2]]
    APP.config = config
    APP.run(process.argv.slice(3))
} else {
    console.log(process.argv[2] + ' is not available in APP_MODULES')
}

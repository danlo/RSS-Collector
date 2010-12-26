/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

// system libraries
var fs = require('fs');
var util = require('util');
var yaml = require('yaml')
// our own libraries
var APP_MODULES = require(__dirname + '/lib');

// load our configuration
try {
  var configYAML = fs.readFileSync(__dirname + '/config.yaml').toString();
  var config = yaml.eval(configYAML);
} catch(e) {
  console.log("File /config.yaml not loadable");
}

// lets start the modules we need to start
if ( process.argv[2] in APP_MODULES ) {
    console.log('Running module: ' + process.argv[2]);
    console.log('Arguments: ' + process.argv.slice(3));
    var APP = APP_MODULES[process.argv[2]];
    APP.config = config;
    APP.run(process.argv.slice(3));
} else {
    console.log(process.argv[2] + ' is not available in APP_MODULES');
}

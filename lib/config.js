/**
 * @author wilburlo@gmail.com Daniel Lo
 * @license MIT License. See LICENSE.txt
 */

// load our configuration
/*jslint evil: true */
var fs = require('fs');
var pp = require('./util').pp;

exports.load = function(config_file) {
    var file = fs.realpathSync(config_file);
    try {
        var yaml = require('yaml');
        var config = yaml.eval(fs.readFileSync(file).toString());
    } catch(e) {
        pp(e);
        console.log("File " + config_file + " not loadable");
        process.exit(1);
    }    
    
    return config;
};

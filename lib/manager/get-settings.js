var clone = require('clone');

module.exports = function() {
    var conf = clone(CFG);
    delete conf.manager.password;
    return conf;
}
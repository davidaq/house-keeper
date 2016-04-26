var store = require('../store');

module.exports = function(req) {
    return store.apps;
}
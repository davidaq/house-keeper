var store = require('./store');

module.exports = function(req) {
    var item = store.apps[req.payload.name];
    if (item && item._id == req.payload._id) {
        delete store.apps[req.payload.name];
    }
    store.signalChanged();
    return {ok:true};
}
const shortid = require('shortid').generate;
const store = require('./store');

module.exports = function(req) {
    if (store.apps[req.payload.name]) {
        return {error:['Oops...', 'An application with the same name already exists']}
    }
    req.payload._id = shortid();
    store.apps[req.payload.name] = req.payload;
    store.signalChanged();
    return {ok:true};
}
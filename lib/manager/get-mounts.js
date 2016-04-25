var store = require('./store');

module.exports = function(req) {
    if (req.payload.id) {
        return store.findMount(req.payload.id);
    }
    return store.mounts;
}
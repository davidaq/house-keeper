var store = require('../store');

module.exports = function(req) {
    var found = store.findMount(req.payload.id, true);
    if (found > -1) {
        store.mounts.splice(found, 1);
    }
    store.signalChanged();
    return {ok:true};
}
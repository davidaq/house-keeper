var store = require('../store');
var shortid = require('shortid').generate;

module.exports = function(req) {
    var item = req.payload;
    item.path = item.path.replace(/\/+/g, '/');
    item.sortName = item.domain + '/' + item.path;
    if (item._id) {
        var found = store.findMount(item._id);
        if (!found) return {error:'Mount not found'};
        for (var k in item) {
            found[k] = item[k];
        }
    } else {
        item._id = shortid();
        store.mounts.push(item);
    }
    store.mounts.sort((a, b) => {
        return a.sortName.localeCompare(b);
    });
    store.signalChanged();
    return {ok:true};
}
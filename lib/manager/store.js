const fs = require('fs');

var changed;

module.exports = {
    mounts: [],
    apps: {},
    signalChanged: function() {
        changed = true;
    },
    findMount: function(id, key) {
        for (var i = 0; i < module.exports.mounts.length; i++) {
            var item = module.exports.mounts[i];
            if (item._id === id) {
                return key ? i : item;
            }
        }
        return key ? -1 : null;
    }
};

fs.readFile('store.json', function(err, content) {
    if (content) {
        try {
            content = JSON.parse(content);
        } catch(e) {
            console.error(e.stack || e.message || e);
            return;
        }
        for (var k in content) {
            module.exports[k] = content[k];
        }
        changed = false;
    }
});

setInterval(function() {
    if (!changed) return;
    changed = false;
    fs.writeFile('store.json', JSON.stringify(module.exports), function(err) {
        if (err) console.error(e.message || e);
    });
}, 5000);
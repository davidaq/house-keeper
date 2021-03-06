const fs = require('fs-promise');
const promiseDebounce = require('promise-debounce');
const server = require('../server');

var appids = {};

const store = module.exports = {
    mounts: [],
    apps: {},
    signalChanged: promiseDebounce(onChange),
    findMount: function(id, key) {
        for (var i = 0; i < store.mounts.length; i++) {
            var item = store.mounts[i];
            if (item._id === id) {
                return key ? i : item;
            }
        }
        return key ? -1 : null;
    },
    findAppById: function(id) {
        return appids[id];
    }
};

fs.readFile('store.json').then(content => {
    content = JSON.parse(content);
    for (var k in content) {
        store[k] = content[k];
    }
    for (var k in store.apps) {
        if (store.apps[k]._id) {
            appids[store.apps[k]._id] = store.apps[k];
        }
    }
    return server.updateConfig(store.apps, store.mounts);
});

function onChange() {
    appids = {};
    for (var k in store.apps) {
        if (store.apps[k]._id) {
            appids[store.apps[k]._id] = store.apps[k];
        }
    }
    return fs.writeFile('store.json', JSON.stringify(store)).catch(err => {
        if (err) console.error(e.message || e);
    }).then(() => server.updateConfig(store.apps, store.mounts));
}
const spawner = require('./spawner');
const route = require('./route');

module.exports = function(apps, mounts) {
    spawner.update(apps)
        .then(backends => {
            var routeTree = {};
            mounts.map(mount => {
                var obj = routeTree;
                var path = mount.domain.split('.');
                path.reverse().map(v => {
                    if (v) {
                        if (obj[v]) {
                            obj = obj[v];
                        } else {
                            obj = obj[v] = {};
                        }
                    }
                });
                obj = obj['#'] = obj['#'] || {};
                path = mount.path.split(/\/+/);
                path.map(v => {
                    if (v) {
                        if (obj[v]) {
                            obj = obj[v];
                        } else {
                            obj = obj[v] = {};
                        }
                    }
                });
                if (!obj['#']) {
                    obj = obj['#'] = {};
                    obj.forceSecure = mount.secure == 'force';
                    obj.app = backends[mount.app] || {};
                }
            });
            route.set(routeTree);
        })
}
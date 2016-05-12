const path = require('path');
const Hapi =  require('hapi');
const fs = require('fs-promise');
const store = require('./store');

module.exports = function() {
    const server = new Hapi.Server({
        connections: {
            routes: {
                files: {
                    relativeTo: path.join(__dirname, '..', '..', 'res', 'public')
                }
            }
        }
    });
    if (CFG.ssl && CFG.ssl.key && CFG.ssl.crt) {
        server.connection({port:CFG.manager.port, tls: {
            key: CFG.ssl.key,
            cert: CFG.ssl.crt
        }});
    } else {
        server.connection({port:CFG.manager.port});
    }
    server.register(require('inert'), _ => {});
    server.register({register:require('yar'), options: {
        storeBlank: false,
        cookieOptions: {
            password: 'something long and boring, just to meet the minimum requirements',
            isSecure: false
        }
    }});
    route(server);
    server.start(err => {
        if (err) throw err;
        console.log('Server started as: ' + server.info.uri);
    });
};

function route(server) {
    server.route({
        method: 'GET',
        path: '/serve-static/{appid}/{path*}',
        handler(req, rep) {
            var app = store.findAppById(req.params.appid);
            if (!app) {
                return rep('Invalid application id: ' + req.params.appid);
            }
            var fpath = req.params.path || '';
            fpath = fpath.split(/[\/\\]+/);
            for (var i = 0; i < fpath.length; i++) {
                if (fpath[i] == '..') {
                    fpath.splice(i - 1, 2);
                    i -= 2;
                } else if (fpath[i] == '.') {
                    fpath.splice(i, 1);
                    i--;
                }
            }
            var base = app.args || '';
            base = base.replace(/^[\/\\]+|[\/\\]+$/g, '');
            var resolvedPath = path.resolve('runtime', app._id, 'app', base, fpath.join(path.sep));
            fs.stat(resolvedPath)
                .then(stat => {
                    if (stat.isDirectory()) {
                        if (req.params.path && !req.params.path.match(/[\/\\]$/)) {
                            if (req.headers.x_original_path) {
                                return rep.redirect(req.headers.x_original_path + '/');
                            }
                        }
                        return rep.file(path.join(resolvedPath, 'index.html'));
                    }
                    rep.file(resolvedPath);
                })
                .catch(err => {
                    console.log(err.stack);
                    rep('Not found').code(404);
                });
        }
    });
    server.route({
        method: 'GET',
        path: '/{path*}',
        handler(req, rep) {
            var path = req.params.path || 'index.html';
            return rep.file(path);
        }
    });
    server.route({
        method: 'POST',
        path: '/{path*}',
        handler(req, rep) {
            Promise.resolve().then(function() {
                // var p = require.resolve('./action/' + req.params.path);
                // var m = require(p);
                // delete require.cache[p];
                var m = require('./action/' + req.params.path);
                req.payload = req.payload || {};
                req.config = CFG.manager;
                return m(req);
            }).then(r => {
                rep(JSON.stringify(r));
            }).catch(e => {
                console.warn(e.stack || e.message || e);
                rep(JSON.stringify(e.stack || e.message || e)).code(500);
            });
        }
    });
}
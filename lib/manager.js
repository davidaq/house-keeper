const path = require('path');
const Hapi =  require('hapi');

module.exports = function() {
    const server = new Hapi.Server({
        connections: {
            routes: {
                files: {
                    relativeTo: path.join(__dirname, '..', 'res', 'public')
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
                var p = require.resolve('./manager/' + req.params.path);
                var m = require(p);
                delete require.cache[p];
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
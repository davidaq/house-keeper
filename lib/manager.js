const path = require('path');
const Hapi =  require('hapi');

module.exports = function() {
    var conf = CFG.manager;
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
        server.connection({port:conf.port, tls: {
            key: CFG.ssl.key,
            cert: CFG.ssl.crt
        }});
    } else {
        server.connection({port:conf.port});
    }
    server.register(require('inert'), _ => {});
    server.register({register:require('yar'), options: {
        storeBlank: false,
        cookieOptions: {
            password: 'something long and boring, just to meet the minimum requirements',
            isSecure: false
        }
    }});
    route(server, conf);
    server.start(err => {
        if (err) throw err;
        console.log('Server started as: ' + server.info.uri);
    });
};

function route(server, conf) {
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
                req.config = conf;
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
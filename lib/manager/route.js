const store = require('./store');

module.exports = function (server) {
    //= serve application static 
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

    //= serve manager static
    server.route({
        method: 'GET',
        path: '/{path*}',
        handler(req, rep) {
            var fpath = req.params.path || 'index.html';
            return rep.file(fpath);
        }
    });

    //= serve manager actions
    server.route({
        method: 'POST',
        path: '/{path*}',
        handler(req, rep) {
            Promise.resolve().then(function() {
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
const store = require('./store');
const path = require('path');
const express = require('express');
const fs = require('fs-promise');

const route = module.exports = express.Router();

route.get('/serve-static/:appid/:path*?', function(req, res) {
    var app = store.findAppById(req.params.appid);
    if (!app) {
        res.writeHead(400, {});
        return res.end('Invalid application id: ' + req.params.appid);
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
    var base = app.wdir || '';
    base = base.replace(/^[\/\\]+|[\/\\]+$/g, '');
    var resolvedPath = path.resolve('runtime', app._id, 'app', base, fpath.join(path.sep));
    fs.stat(resolvedPath)
        .then(stat => {
            if (stat.isDirectory()) {
                if (req.params.path && !req.params.path.match(/[\/\\]$/)) {
                    if (req.headers.x_original_path) {
                        res.writeHead(302, {Location: req.headers.x_original_path + '/'});
                        res.end();
                        return;
                    }
                }
                return res.sendFile(path.join(resolvedPath, 'index.html'));
            }
            rep.sendFile(resolvedPath);
        })
        .catch(err => {
            console.log(err.stack);
            res.writeHead(404, {});
            res.end('Not found');
        });
});

route.post('/:path*', function(req, res) {
    Promise.resolve().then(function() {
        var m = require('./action/' + req.params.path);
        req.payload = req.body || {};
        req.config = CFG.manager;
        return m(req);
    }).then(r => {
        res.end(JSON.stringify(r));
    }).catch(e => {
        console.warn(e.stack || e.message || e);
        res.writeHead(500, {});
        res.end(JSON.stringify(e.stack || e.message || e));
    });
});

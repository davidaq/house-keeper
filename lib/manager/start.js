const path = require('path');
const express = require('express');
const session = require('express-session');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const httpolyglot = require('httpolyglot');

module.exports = function() {

    const route = require('./route');

    const app = express();

    app.use(serveStatic(path.join(__dirname, '..', '..', 'res', 'public'), {
        index: [ 'index.html' ]
    }));
    app.use(session({
        resave: true,
        saveUninitialized: false,
        genid: function(req) {
            return shortid.generate();
        },
        secret: shortid.generate(),
    }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(route);

    if (CFG.ssl && CFG.ssl.key && CFG.ssl.crt) {
        try {
            httpolyglot.createServer({
                key: CFG.ssl.key,
                cert: CFG.ssl.crt,
            }, function(req, res) {
                if (req.socket.encrypted) {
                    app.handle(req, res);
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    var result = '<!DOCTYPE html>'
                        + '<html>'
                        + '<head>'
                        + '<script type="text/javascript">'
                        + 'document.location.href = "https" + document.location.href.substr(4);'
                        + '</script>'
                        + '</head>'
                        + '<body>Must visit with HTTPS</body>'
                        + '</html>';
                    res.end(result);
                }
            }).listen(CFG.manager.port || 3000);
            return;
        } catch(e) {
            CFG.ssl.key = '';
            CFG.ssl.crt = '';
            console.error(e.stack);
        }
    }
    app.listen(CFG.manager.port || 3000);
}

const path = require('path');
const Hapi =  require('hapi');
const fs = require('fs-promise');

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
        server.connection({
            port: CFG.manager.port, 
            tls: {
                key: CFG.ssl.key,
                cert: CFG.ssl.crt
            }
        });
    } else {
        server.connection({ port: CFG.manager.port });
    }
    server.register(require('inert'), _ => {});
    server.register({register:require('yar'), options: {
        storeBlank: false,
        cookieOptions: {
            password: 'something long and boring, just to meet the minimum requirements',
            clearInvalid: true,
            isSecure: false
        }
    }});
    require('./route')(server);
    server.start(err => {
        if (err) throw err;
        console.log('Server started as: ' + server.info.uri);
    });
};

const path = require('path');
const Hapi =  require('hapi');

module.exports = function(conf) {
    const server = new Hapi.Server({
        connections: {
            routes: {
                files: {
                    relativeTo: path.join(__dirname, '..', 'static')
                }
            }
        }
    });
    
    route(server);
    server.connection({port:conf.port});
    
    server.start(err => {
        if (err) throw err;
        console.log('Server started as: ' + server.info.uri);
    });
};

function route(server) {
    
}
'use strict';
const http = require('http');
const https = require('https');
const route = require('./route');

module.exports = function() {
	let httpServer = http.createServer(route.app.bind(route, false));
    httpServer.on('error', err => console.error(err.stack || err.message|| err));
	httpServer.listen(CFG.server.http_port, () => {
		console.log('HTTP on port', CFG.server.http_port);
	});
	if (CFG.ssl && CFG.ssl.key && CFG.ssl.crt) {
		httpServer = https.createServer({
			key: CFG.ssl.key,
			cert: CFG.ssl.crt
		}, route.app.bind(route, true));
        httpServer.on('error', err => console.error(err.stack || err.message|| err));
        httpServer.listen(CFG.server.https_port, () => {
            console.log('HTTPS on port', CFG.server.https_port);
        });
	}
}
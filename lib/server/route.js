const http = require('http');
const https = require('https');
const parseurl = require('url').parse;

var routeTree = {
	localhost: {
		'%': {
			manager: {
				'%': {
					url: 'http://localhost:3000/',
					forceSecure: false,
					host: ''
				}
			}
		}
	}
};

exports.app = function(isHTTPS, req, res) {
	Promise.resolve()
		.then(() => {
			var search = '';
			var path = req.url.replace(/\?.*?$/, m => {
				search = m[0];
				return '';
			}).split(/\/+/).filter(v => v);
			var domainName = req.headers.host.replace(/\:[0-9]+/, '');
			var host = domainName.split('.');
			var obj = routeTree;
			for (var i = host.length - 1; i >= 0; i--) {
				if (obj[host[i]]) {
					obj = obj[host[i]];
				} else {
					break;
				}
			}
			if (!obj['%'])
				throw 'No matching host';
			obj = obj['%'];
			for (var i = 0; i < path.length; i++) {
				if (obj[path[i]]) {
					obj = obj[path[i]];
				} else {
					break;
				}
			}
			path = path.slice(i).join('/') + search;
			if (!obj['%']) 
				throw 'No matching path';
			obj = obj['%'];
			if (obj.forceSecure && !isHTTPS) {
				var port = '';
				if (CFG.server.https_port != 443) {
					port = ':' + CFG.server.https_port;
				}
				throw {redirect:'https://' + domainName + port + req.url};
			} else if (!path && !req.url.match(/\/$/)) {
				var port = '';
				if (isHTTPS) {
					if (CFG.server.https_port != 443)
						port = ':' + CFG.server.https_port;
				} else if (CFG.server.http_port != 80) {
					port = ':' + CFG.server.http_port;
				}
				throw {redirect:(isHTTPS ? 'https://' : 'http://') + domainName + port + req.url + '/'};
			} else {
				var targetUrl = parseurl(obj.url + path);
				var protocol = targetUrl.protocol == 'https:' ? https : http;
				targetUrl.hostname = targetUrl.host = obj.host || domainName;
				targetUrl.method = req.method;
				targetUrl.headers = req.headers;
				targetUrl.rejectUnauthorized = false;
				return new Promise((resolve, reject) => {
					var targetReq = protocol.request(targetUrl, targetRes => {
						res.statusCode = targetRes.statusCode;
						res.statusMessage = targetRes.statusMessage;
						for (var k in targetRes.headers) {
							res.setHeader(k, targetRes.headers[k]);
						}
						targetRes.pipe(res);
						resolve();
					});
					req.pipe(targetReq);
				});
			}
			console.log(isHTTPS, obj, path);
		}).catch(err => {
			if (typeof err == 'string') {
				res.statusCode = 401;
				res.statusMessage = 'Bad Gateway';
				res.end(err);
			} else if (err.redirect) {
				res.statusCode = 302;
				res.statusMessage = 'Must Use HTTPS';
				res.setHeader('location', err.redirect);
				res.end();
			} else {
				res.statusCode = 500;
				res.statusMessage = 'Gateway Internal Error';
				res.end(err.stack || err.message || err);
			}
		})
}

exports.set = function(newRouteTree) {
	if (newRouteTree && typeof newRouteTree == 'object') {
		routeTree = newRouteTree;
	}
}
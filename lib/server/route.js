const http = require('http');
const https = require('https');
const parseurl = require('url').parse;

var routeTree = {};

exports.app = function(isHTTPS, req, res) {
	Promise.resolve()
		.then(() => {
			var parsed = parseurl(req.url);
			var search = parsed.search || '';
			var originalPath = parsed.pathname || '/';
			var path = originalPath.split(/\/+/).filter(v => v);
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
			if (!obj['#'])
				throw 'No matching host';
			obj = obj['#'];
			for (var i = 0; i < path.length; i++) {
				if (obj[path[i]]) {
					obj = obj[path[i]];
				} else {
					break;
				}
			}
			if (originalPath.match(/[\/\\]$/))
				path.push('');
			path = path.slice(i).join('/');
			if (!obj['#']) 
				throw 'No matching path';
			obj = obj['#'];
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
                var targetUrl;
                obj = obj.app;
                if (!obj.url)
                    throw 'Application not ready';
                if (Array.isArray(obj.url)) {
                    targetUrl = obj.robin - 0 || 0;
                    obj.robin = (targetUrl + 1) % obj.url;
                    targetUrl = obj.url[targetUrl];
                } else {
                    targetUrl = obj.url;
                }
                var resolvedUrl = targetUrl + path + search;
                console.log('>>  redirect', resolvedUrl);
				targetUrl = parseurl(resolvedUrl);
				var protocol = targetUrl.protocol == 'https:' ? https : http;
				targetUrl.method = req.method;
				targetUrl.headers = req.headers || {};
				if (obj.host) {
					if (targetUrl.headers.host) {
						targetUrl.headers.x_original_host = targetUrl.headers.host;
					}
					targetUrl.headers.host = obj.host;
				}
				targetUrl.headers.x_original_path = originalPath;
				targetUrl.headers.x_original_search = search;
				targetUrl.rejectUnauthorized = false;
				return new Promise((resolve, reject) => {
					var targetReq = protocol.request(targetUrl, targetRes => {
                        try {
                            res.statusCode = targetRes.statusCode;
                            res.statusMessage = targetRes.statusMessage;
                            for (var k in targetRes.headers) {
                                res.setHeader(k, targetRes.headers[k]);
                            }
                            targetRes.pipe(res);
                            resolve();
                        } catch(err) {
                            reject(err);
                        }
					});
                    targetReq.setTimeout(15000, evt => {
                    	console.error('Timeout: ' + resolvedUrl);
                        reject('Backend host timeout');
                    });
                    targetReq.on('error', err => {
                    	console.error('Err: ' + resolvedUrl);
                        console.error(err.stack || err.message || err);
                        reject('Unable to reach backend host');
                    });
					req.pipe(targetReq);
				});
			}
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
		}).catch(err => {
            console.error(err.stack || err.message || err);
		})
}

exports.set = function(newRouteTree) {
	if (newRouteTree && typeof newRouteTree == 'object') {
		routeTree = newRouteTree;
	}
}
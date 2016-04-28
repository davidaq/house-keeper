const server = require('../../server');

module.exports = function(req) {
	return server.getAllStatus();
}
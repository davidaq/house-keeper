const store = require('../store');
const server = require('../../server');
const shortid = require('shortid').generate;

module.exports = function(req) {
	if (!req.payload.name) {
		return {error:['Oops...', 'App name no specified']};
	}
	var item = store.apps[req.payload.name];
	if (!item) {
		return {error:['Oops...', 'Application not found']};
	}
	delete req.payload._id;
	if (req.payload.type == 'git') {
		if (req.payload.hasOwnProperty('repo')) {
			delete req.payload.repo;
		}
	}
	for (var k in req.payload) {
		if (req.payload.hasOwnProperty(k)) {
			item[k] = req.payload[k];
		}
	}
	server.updateApp(item._id);
	return {ok:true};
}
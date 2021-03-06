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
	if (req.payload.type) {
		if (!req.payload.username) {
			req.payload.password = '';
		}
		if (req.payload.password == '<!-- %Not Changed% -->') {
			delete req.payload.password;
		}
		for (var k in req.payload) {
			if (req.payload.hasOwnProperty(k)) {
				item[k] = req.payload[k];
			}
		}
	    store.signalChanged()
	    	.then(() => server.updateApp(item._id))
	} else {
		server.updateApp(item._id);
	}
	return {ok:true};
}
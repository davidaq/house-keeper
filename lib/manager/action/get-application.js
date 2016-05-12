var store = require('../store');

module.exports = function(req) {
    return copy(store.apps, item => {
    	var ret = copy(item);
    	if (ret.password)
    		ret.password = '<!-- %Not Changed% -->';
    	return ret;
    });
}

function copy(obj, func) {
	var ret = {};
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			ret[k] = func ? func(obj[k]) : obj[k];
		}
	}
	return ret;
}
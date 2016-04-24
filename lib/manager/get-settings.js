var fs = require('fs');
var yaml = require('yamljs');

module.exports = function() {
    return new Promise(function(resolve) {
        fs.readFile('conf.yaml', function(err, content) {
            if (!content) {
                resolve({error:'Unable to load configurations'});
            } else {
                try {
                    var result = yaml.parse(content.toString());
                    delete result.manager.password;
                    resolve(result);
                } catch(e) {
                    console.error(e.stack || e.message || e);
                    resolve({error:'Configuration file corrupted'});
                }
            }
        });
    });
}
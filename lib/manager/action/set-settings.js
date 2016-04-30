const yaml = require('yamljs');
const fs = require('fs');
const crypto = require('crypto');

module.exports = function(req) {
    if (req.payload) {
        var config = req.payload;
        if (!((config.manager.port -= 0) > 0 && config.manager.port < 65535))
            return {error: {'manager.port':'Invalid port number'}};
        if (!((config.server.http_port -= 0) > 0 && config.server.http_port < 65535))
            return {error: {'server.http_port':'Invalid port number'}};
        if (!((config.server.https_port -= 0) > 0 && config.server.https_port < 65535))
            return {error: {'server.https_port':'Invalid port number'}};
        config.ssl.key = config.ssl.key || '';
        config.ssl.crt = config.ssl.crt || '';
        if (config.manager.password) {
            var sha1 = crypto.createHash('sha1');
            sha1.write(config.manager.password);
            config.manager.password = sha1.digest('base64');
        } else {
            config.manager.password = req.config.password;
        }
        fs.writeFile('conf.yaml', yaml.stringify(config, 4, 4), err => {
            process.exit(1);
        });
    }
    return {ok:true};
}
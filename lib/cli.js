const path = require('path');
const fs = require('fs');
const yaml = require('yamljs');

fs.readFile('conf.yaml', function(err, content) {
    if (err) {
        fs.readFile(path.join(__dirname, '..', 'res', 'defaultConf.yaml'), function(err, content) {
            if (err) {
                console.log('Unable to read configuration file');
                process.exit(2);
            }
            fs.writeFile('conf.yaml', content, function(err) {
                if (err) {
                    console.log(path.resolve('conf.yaml') + ' is inaccessible, please check your file system.');
                    process.exit(2);
                }
                console.log('No configuration found, creating one with default values');
                startup(yaml.parse(content.toString()));
            });
        });
    } else {
        startup(yaml.parse(content.toString()));
    }
});

function startup(conf) {
    try {
        require('./manager')(conf.manager);
        require('./server')(conf.server);
    } catch(err) {
        console.error(err.stack || err);
    }
}
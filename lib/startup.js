const path = require('path');
const fs = require('fs-promise');
const yaml = require('yamljs');

fs.readFile('conf.yaml').then(content => {
    startup(yaml.parse(content.toString()));
}).catch(err => {
    return fs.readFile(path.join(__dirname, '..', 'res', 'defaultConf.yaml'))
        .then(content => {
            return fs.writeFile('conf.yaml', content).catch(err => {
                console.log('Unable to write configuration file');
                process.exit(2);
            }).then(() => {
                console.log('No configuration found, creating one with default values');
                startup(yaml.parse(content.toString()));
            })
        }).catch(err => {
            console.log('Unable to load configuration file');
            process.exit(2);
        });
})

function startup(conf) {
    GLOBAL.CFG = conf;
    try {
        require('./manager').start();
        require('./server').start();
    } catch(err) {
        console.error(err.stack || err);
    }
}
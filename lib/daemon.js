const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');

exports.start = function() {
    return fs.readFile('pid', 'utf-8')
        .catch(err => null)
        .then(pid => {
            try {
                process.kill(pid - 0, 0);
                return true;
            } catch(err) {}
            return false;
        })
        .then(exists => {
            if (exists) {
                console.warn('Found existing pid, please stop first');
                process.exit(2);
                return;
            }
            return fs.writeFile('pid', 'TEST');
        .catch(err => {
            console.warn('Unable to write pid file, service not started');
            process.exit(2);
        })
        .then(() => {
            const child = cp.spawn(process.argv[0], [process.argv[1], 'guard'], {
                detached: true,
                stdio: ['ignore']
            });
            child.unref();
            fs.writeFile('pid', child.pid + '')
                .then(() => {
                    console.log('Daemon started: pid =', child.pid);
                })
                .catch(err => {
                    child.kill('SIGINT');
                    console.warn('Unable to write pid file, will terminate');
                    process.exit(2);
                });
        })
};

exports.guard = function() {
    process.on('SIGHUP', () => { });
    var child;
    startProcess();

    function startProcess() {
        child = cp.fork(path.join(__dirname, 'cli.js'));
        child.on('close', code => {
            setTimeout(startProcess, 500);
        });
    }
};

exports.stop = function() {
    return fs.readFile('pid', 'utf-8')
        .then(pid => {
            try {
                process.kill(pid - 0, 'SIGINT');
                console.log('Process ' + pid + ' killed');
            } catch(err) {
                console.log('Process ' + pid + ' may not exist anymore');
            }
            return fs.unlink('pid').catch(err => null)
        })
        .catch(err => {
            console.log('No pid file found');
        })
};

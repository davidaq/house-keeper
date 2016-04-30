const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');

exports.start = function() {
    return fs.readFile('pid', 'utf-8')
        .catch(err => false)
        .then(pid => processExists(pid))
        .then(exists => {
            if (exists) {
                console.warn('Found existing pid, please stop first');
                process.exit(2);
                return;
            }
            return fs.writeFile('pid', 'TEST')
        })
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
                    process.exit(0);
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
        child = cp.spawn(process.argv[0], [path.join(__dirname, 'cli.js')]);
        child.on('close', code => {
            setTimeout(startProcess, 500);
        });
    }
};

exports.stop = function() {
    return fs.readFile('pid', 'utf-8')
        .catch(err => {
            console.log('No pid file found');
            return 0;
        })
        .then(pid => {
            if (pid) {
                if (!processExists(pid)) {
                    console.log('Process do not exist anymore');
                    return;
                }
                console.log('Killing process ' + pid);
                try {
                    process.kill(pid - 0, 'SIGINT');
                } catch(err) {
                }
                return waitProcess(pid)
                    .then(() => console.log('Killed'));
            }
        })
        .then(() => {
            return fs.unlink('pid').catch(err => null);
        })
        .catch(() => console.error('No process killed'))
};

function processExists(pid) {
    if (pid) {
        try {
            process.kill(pid - 0, 0);
            return true;
        } catch(err) {}
    }
    return false;
}

function waitProcess(pid, timeout) {
    timeout = Math.max(timeout || 10000, 1000);
    return new Promise((resolve, reject) => {
        var interval = setInterval(() => {
            if (!processExists(pid)) {
                resolve();
                clearTimeout(timeout);
                clearInterval(interval);
            }
        }, 500);
        timeout = setTimeout(() => {
            clearInterval(interval);
            if (processExists(pid)) {
                reject();
            } else {
                resolve();
            }
        }, timeout);
    })
}

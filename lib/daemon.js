const cp = require('child_process');
const fs = require('fs-promise');
const path = require('path');
const processCheck = require('./process-check');

const cliPath = path.join(__dirname, 'cli.js');

exports.check = function() {
    return fs.readFile('pid', 'utf-8')
        .catch(err => false)
        .then(pid => processCheck.exists(pid))
        .then(exists => {
            if (exists) {
                console.warn('Found running instance, please stop first');
                process.exit(2);
                return;
            }
        })
};

exports.start = function() {
    return exports.check()
        .then(() => fs.writeFile('pid', 'TEST'))
        .catch(err => {
            console.warn('Unable to write pid file, service not started');
            process.exit(2);
        })
        .then(() => {
            const child = cp.spawn(process.execPath, [cliPath, 'guard', '--inner-call'], {
                env: process.env,
                detached: true,
                stdio: ['ignore']
            });
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
            child.unref();
        })
};

exports.guard = function() {
    var child;
    startProcess();

    process.on('SIGHUP', () => { });

    function startProcess() {
        child = cp.spawn(process.execPath, [cliPath, 'run', '--inner-call'], {
            env: process.env,
            stdio: ['ignore']
        });
        child.on('error', err => {
            fs.write('x.err.log', err.stack, () => null);
        });
        processCheck.autoKill(child);
        child.on('close', code => {
            setTimeout(startProcess, 1500);
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
                if (!processCheck.exists(pid)) {
                    console.log('Process do not exist anymore');
                    return;
                }
                console.log('Killing process ' + pid);
                try {
                    process.kill(pid - 0, 'SIGINT');
                } catch(err) {
                }
                return processCheck.wait(pid)
                    .then(() => console.log('Killed'));
            }
        })
        .then(() => {
            return fs.unlink('pid').catch(err => null);
        })
        .catch(() => console.error('No process killed'))
};

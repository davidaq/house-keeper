
exports.exists = function (pid) {
    if (pid) {
        try {
            process.kill(pid - 0, 0);
            return true;
        } catch(err) {}
    }
    return false;
};

exports.wait = function (pid, timeout) {
    timeout = Math.max(timeout || 10000, 1000);
    return new Promise((resolve, reject) => {
        var interval = setInterval(() => {
            if (!exports.exists(pid)) {
                resolve();
                clearTimeout(timeout);
                clearInterval(interval);
            }
        }, 250);
        timeout = setTimeout(() => {
            clearInterval(interval);
            if (exports.exists(pid)) {
                reject();
            } else {
                resolve();
            }
        }, timeout);
    })
};

var autoKills;

exports.autoKill = function(child) {
    if (!autoKills) {
        autoKills = {};
        process.on('SIGINT', killChilds);
        process.on('SIGTERM', killChilds);
    }
    autoKills[child.pid] = 1;
    child.once('exit', () => {
        delete autoKills[child.pid];
    });
};

function killChilds() {
    return Promise.all(Object.keys(autoKills).map(pid => {
        try {
            process.kill(pid - 0, 'SIGINT');
        } catch(e) {};
        return exports.wait(pid);
    }))
    .then(() => process.exit(0))
    .catch(() => console.warn('Child did not exit'))
}
